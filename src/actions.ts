import type ModuleInstance from './main.js'

export type ActionsSchema = {
	sequence_command: { options: { command: string; cell: string } }
	group_command: { options: { command: string; group: number } }
	global_command: { options: { command: string; group: number } }
	send_raw: { options: { command: string } }
	toggle_alternation: { options: { cellA: string; cellB: string; firstCell: string; pollInterval: number } }
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		sequence_command: {
			name: 'Sequence: Start / Stop / Cut / Status',
			options: [
				{
					id: 'command',
					type: 'dropdown',
					label: 'Command',
					default: 'START',
					choices: [
						{ id: 'START', label: 'Start sequence' },
						{ id: 'STOP', label: 'Stop sequence' },
						{ id: 'CUT', label: 'Cut sequence' },
						{ id: 'CSTAT', label: 'Get cell status' },
					],
				},
				{ id: 'cell', type: 'textinput', label: 'Cell coordinate', default: 'A1', regex: '/^[A-Z]+[1-9][0-9]*$/i' },
			],
			callback: async (event) => {
				const command = String(event.options.command)
				const cell = String(event.options.cell).trim().toUpperCase()
				if (!/^[A-Z]+[1-9][0-9]*$/.test(cell)) {
					self.log('warn', `Invalid cell coordinate: ${cell}`)
					return
				}
				await self.sendCommand(`${command} [${cell}]`)
			},
		},
		group_command: {
			name: 'Group: Start / Stop / Cut',
			options: [
				{
					id: 'command',
					type: 'dropdown',
					label: 'Command',
					default: 'CUT',
					choices: [
						{ id: 'START', label: 'Start group' },
						{ id: 'STOP', label: 'Stop group' },
						{ id: 'CUT', label: 'Cut group' },
					],
				},
				{ id: 'group', type: 'number', label: 'Group (1-10)', default: 1, min: 1, max: 10 },
			],
			callback: async (event) => {
				const group = Math.max(1, Math.min(10, Math.round(Number(event.options.group) || 1)))
				await self.sendCommand(`${String(event.options.command)} GRP${group}`)
			},
		},
		global_command: {
			name: 'Global command',
			options: [
				{
					id: 'command',
					type: 'dropdown',
					label: 'Command',
					default: 'GLOBSTART',
					choices: [
						{ id: 'GLOBSTART', label: 'Start selected group' },
						{ id: 'GLOBSTOP', label: 'Stop selected group' },
						{ id: 'PAUSE', label: 'Pause executing sequences' },
						{ id: 'PAUSECUT', label: 'Pause and cut executing sequences' },
						{ id: 'RESUME', label: 'Resume sequences' },
						{ id: 'EM_STOP', label: 'Emergency stop all equipment' },
						{ id: 'GET_STA', label: 'Get global status' },
						{ id: 'SELECT', label: 'Select group' },
					],
				},
				{ id: 'group', type: 'number', label: 'Group (for Select group)', default: 1, min: 1, max: 10 },
			],
			callback: async (event) => {
				const command = String(event.options.command)
				const group = Math.max(1, Math.min(10, Math.round(Number(event.options.group) || 1)))
				await self.sendCommand(command === 'SELECT' ? `SELECT${String(group).padStart(2, '0')}` : command)
			},
		},
		toggle_alternation: {
			name: 'Toggle automatic cell alternation',
			description: 'Turn automatic switching between two sequence cells on or off',
			options: [
				{ id: 'cellA', type: 'textinput', label: 'Preset cell X', default: 'A1' },
				{ id: 'cellB', type: 'textinput', label: 'Preset cell Y', default: 'B1' },
				{
					id: 'firstCell',
					type: 'dropdown',
					label: 'Cell to start when enabling',
					default: 'X',
					choices: [
						{ id: 'X', label: 'Preset cell X' },
						{ id: 'Y', label: 'Preset cell Y' },
					],
				},
				{ id: 'pollInterval', type: 'number', label: 'Status poll interval (ms)', default: 1000, min: 500, max: 10000 },
			],
			callback: async (event) => {
				self.toggleAlternation({
					cellA: String(event.options.cellA).trim().toUpperCase(),
					cellB: String(event.options.cellB).trim().toUpperCase(),
					firstCell:
						String(event.options.firstCell).toUpperCase() === 'Y'
							? String(event.options.cellB).trim().toUpperCase()
							: String(event.options.cellA).trim().toUpperCase(),
					pollInterval: Number(event.options.pollInterval) || 1000,
				})
			},
		},
		send_raw: {
			name: 'Send custom TCP command',
			options: [{ id: 'command', type: 'textinput', label: 'Command (without line ending)', default: 'CUT GRP1' }],
			callback: async (event) => {
				const command = String(event.options.command).trim()
				if (command) await self.sendCommand(command)
			},
		},
	})
}
