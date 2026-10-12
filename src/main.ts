import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { createConnection, type Socket } from 'node:net'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // Setup in init()
	private socket?: Socket
	private receiveBuffer = ''
	private reconnectTimer?: ReturnType<typeof setTimeout>
	private connectionGeneration = 0
	private shuttingDown = false
	private pendingCellQuery = ''
	private pendingQueryLines: string[] = []
	private pendingStatusMatrix?: { columns: number; rows: number; lines: string[] }
	private pendingQueryTimeout?: ReturnType<typeof setTimeout>
	private alternationPollTimer?: ReturnType<typeof setTimeout>
	private alternation?: {
		cellA: string
		cellB: string
		activeCell: string
		pollInterval: number
		sawRunning: boolean
		started: boolean
	}

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.shuttingDown = false

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updatePresets() // export Presets
		this.updateVariableDefinitions() // export variable definitions
		this.setVariableValues({ alternation_status: 'Off' })
		this.connect()
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.shuttingDown = true
		this.connectionGeneration++
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
		this.stopAlternation(false)
		this.clearPendingCellQuery()
		this.socket?.destroy()
		this.socket = undefined
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.connectionGeneration++
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
		this.stopAlternation(true)
		this.clearPendingCellQuery()
		this.socket?.destroy()
		this.socket = undefined
		this.connect()
	}

	private connect(): void {
		if (this.shuttingDown || !this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'Enter the TuningS computer IP address or hostname')
			return
		}
		const generation = ++this.connectionGeneration
		this.updateStatus(InstanceStatus.Connecting)
		const socket = createConnection({ host: this.config.host, port: Number(this.config.port) || 22222 })
		this.socket = socket
		socket.setTimeout(Number(this.config.connectTimeout) || 5000)
		socket.on('connect', () => {
			if (generation !== this.connectionGeneration) return
			socket.setTimeout(0)
			this.updateStatus(InstanceStatus.Ok)
			this.log('info', `Connected to TuningS at ${this.config.host}:${this.config.port || 22222}`)
			if (this.alternation) {
				void this.startAlternationCell()
				this.scheduleAlternationPoll(this.alternation.pollInterval)
			}
		})
		socket.on('data', (data) => this.onData(data))
		socket.on('timeout', () => socket.destroy(new Error('TCP connection timed out')))
		socket.on('error', (error) => {
			if (generation === this.connectionGeneration) this.log('error', `TCP error: ${error.message}`)
		})
		socket.on('close', () => {
			if (generation !== this.connectionGeneration || this.shuttingDown) return
			this.socket = undefined
			this.clearPendingCellQuery()
			this.updateStatus(InstanceStatus.Disconnected)
			this.reconnectTimer = setTimeout(() => this.connect(), 5000)
		})
	}

	private onData(data: Buffer | string): void {
		this.receiveBuffer += typeof data === 'string' ? data : data.toString('utf8')
		const lines = this.receiveBuffer.split(/\r\n|\n|\r/)
		this.receiveBuffer = lines.pop() ?? ''
		for (const line of lines) {
			if (!line) continue
			if (this.pendingCellQuery) this.pendingQueryLines.push(line)
			this.setVariableValues({ last_response: line })
			this.log('debug', `TuningS: ${line}`)
			this.consumeCellStatusLine(line)
		}
	}

	private consumeCellStatusLine(line: string): void {
		if (!this.pendingCellQuery) return
		const targetCell = this.pendingCellQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		const namedStatus = line.match(new RegExp(`(?:^|\\b)\\[?${targetCell}\\]?\\s*[:,= ]\\s*([0-4])(?:\\b|$)`, 'i'))
		if (namedStatus) {
			this.completeCellStatus(this.pendingCellQuery, namedStatus[1])
			return
		}
		const dimensions = line.match(/(?:^|\s)(\d+)\s*x\s*(\d+)\s*$/i)
		if (dimensions) {
			this.pendingStatusMatrix = { columns: Number(dimensions[1]), rows: Number(dimensions[2]), lines: [] }
			return
		}
		if (this.pendingStatusMatrix && /^[0-4]+$/.test(line.trim())) {
			this.pendingStatusMatrix.lines.push(line.trim())
			if (this.pendingStatusMatrix.lines.length < this.pendingStatusMatrix.rows) return
			const cell = this.pendingCellQuery
			const coordinate = cell.match(/^([A-Z]+)(\d+)$/)
			if (!coordinate) return
			const column = [...coordinate[1]].reduce((value, char) => value * 26 + char.charCodeAt(0) - 64, 0)
			const row = Number(coordinate[2])
			const status = this.pendingStatusMatrix.lines[row - 1]?.[column - 1]
			if (status !== undefined && column <= this.pendingStatusMatrix.columns) this.completeCellStatus(cell, status)
			return
		}
		const directStatus = line.trim().match(/^[^0-4]*([0-4])[^0-4]*$/)
		if (directStatus) this.completeCellStatus(this.pendingCellQuery, directStatus[1])
	}

	private completeCellStatus(cell: string, status: string): void {
		this.pendingCellQuery = ''
		this.pendingQueryLines = []
		this.pendingStatusMatrix = undefined
		if (this.pendingQueryTimeout) clearTimeout(this.pendingQueryTimeout)
		this.setVariableValues({ last_cell: cell, cell_status: status })
		this.checkFeedbacks('cell_state')
		this.handleAlternationStatus(cell, Number(status))
	}

	private clearPendingCellQuery(): void {
		if (this.pendingQueryTimeout) clearTimeout(this.pendingQueryTimeout)
		this.pendingQueryTimeout = undefined
		this.pendingCellQuery = ''
		this.pendingQueryLines = []
		this.pendingStatusMatrix = undefined
	}

	async sendCommand(command: string): Promise<boolean> {
		const socket = this.socket
		if (!socket || !socket.writable || socket.connecting) {
			this.log('warn', `Not connected; command not sent: ${command}`)
			return false
		}
		const endings: Record<ModuleConfig['lineEnding'], string> = { cr: '\r', lf: '\n', crlf: '\r\n', none: '' }
		const ending = endings[this.config.lineEnding] ?? '\r\n'
		socket.write(command.replace(/[\r\n]+$/g, '') + ending)
		const cellQuery = command.match(/^CSTAT\s+\[([A-Z]+[1-9]\d*)\]$/i)
		if (cellQuery) {
			this.pendingCellQuery = cellQuery[1].toUpperCase()
			this.pendingQueryLines = []
			this.pendingStatusMatrix = undefined
			this.setVariableValues({ last_cell: this.pendingCellQuery, cell_status: '' })
			if (this.pendingQueryTimeout) clearTimeout(this.pendingQueryTimeout)
			this.pendingQueryTimeout = setTimeout(
				() => {
					const received = this.pendingQueryLines.join(' | ') || this.receiveBuffer || '<no delimited response>'
					this.pendingCellQuery = ''
					this.pendingQueryLines = []
					this.pendingStatusMatrix = undefined
					this.log(
						'warn',
						`Timed out waiting for CSTAT response for ${cellQuery[1].toUpperCase()}; received: ${received}`,
					)
				},
				Math.max(3000, Number(this.config.connectTimeout) || 5000),
			)
		}
		this.log('debug', `Sent: ${command}`)
		return true
	}

	toggleAlternation(options: { cellA: string; cellB: string; firstCell: string; pollInterval: number }): void {
		if (this.alternation) {
			this.stopAlternation(true)
			return
		}
		const { cellA, cellB } = options
		if (!/^[A-Z]+[1-9]\d*$/.test(cellA) || !/^[A-Z]+[1-9]\d*$/.test(cellB) || cellA === cellB) {
			this.log('warn', 'Automatic alternation needs two different valid cell coordinates')
			return
		}
		const firstCell = options.firstCell === cellB ? cellB : cellA
		const pollInterval = Math.max(500, Math.min(10000, Math.round(options.pollInterval || 1000)))
		this.alternation = { cellA, cellB, activeCell: firstCell, pollInterval, sawRunning: false, started: false }
		this.setVariableValues({ alternation_status: `On - ${firstCell}` })
		this.checkFeedbacks('alternation_active')
		void this.startAlternationCell()
		// Let TuningS return the START acknowledgement before asking for cell status.
		this.scheduleAlternationPoll(pollInterval)
		this.log('info', `Automatic alternation enabled: ${cellA} ↔ ${cellB}, polling every ${pollInterval} ms`)
	}

	isAlternationActive(): boolean {
		return this.alternation !== undefined
	}

	private stopAlternation(updateState: boolean): void {
		if (this.alternationPollTimer) clearTimeout(this.alternationPollTimer)
		this.alternationPollTimer = undefined
		this.alternation = undefined
		this.clearPendingCellQuery()
		if (updateState) {
			this.setVariableValues({ alternation_status: 'Off' })
			this.checkFeedbacks('alternation_active')
			this.log('info', 'Automatic alternation disabled')
		}
	}

	private scheduleAlternationPoll(delay?: number): void {
		if (this.alternationPollTimer) clearTimeout(this.alternationPollTimer)
		if (!this.alternation) return
		this.alternationPollTimer = setTimeout(
			() => this.pollAlternationStatus(),
			delay ?? this.alternation?.pollInterval ?? 1000,
		)
	}

	private pollAlternationStatus(): void {
		const alternation = this.alternation
		if (!alternation) return
		if (!this.pendingCellQuery && this.socket?.writable && !this.socket.connecting) {
			this.requestAlternationStatus(alternation.activeCell)
		}
		this.scheduleAlternationPoll(alternation.pollInterval)
	}

	private requestAlternationStatus(cell: string): void {
		// CSTAT asks for one cell directly; GET_STA returns the full status matrix.
		// sendCommand() initializes the matching response parser and timeout.
		void this.sendCommand(`CSTAT [${cell}]`)
	}

	private async startAlternationCell(): Promise<void> {
		const alternation = this.alternation
		if (!alternation || alternation.started) return
		const cell = alternation.activeCell
		const sent = await this.sendCommand(`START [${cell}]`)
		if (sent && this.alternation === alternation && alternation.activeCell === cell) alternation.started = true
	}

	private handleAlternationStatus(cell: string, status: number): void {
		const alternation = this.alternation
		if (!alternation || cell !== alternation.activeCell) return
		if (status === 2 || status === 3) {
			alternation.sawRunning = true
			return
		}
		// TuningS can report either "stopped" (1) or "stopped and ready" (4)
		// after a sequence finishes, depending on the sequence/controller state.
		if ((status !== 1 && status !== 4) || !alternation.sawRunning) return
		const nextCell = cell === alternation.cellA ? alternation.cellB : alternation.cellA
		alternation.activeCell = nextCell
		alternation.sawRunning = false
		alternation.started = false
		this.setVariableValues({ alternation_status: `On - ${nextCell}` })
		this.log('info', `Cell ${cell} completed; starting ${nextCell}`)
		void this.startAlternationCell()
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}
}
