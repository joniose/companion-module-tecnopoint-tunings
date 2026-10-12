import type { SomeCompanionConfigField } from '@companion-module/base'

export type ModuleConfig = {
	host: string
	port: number
	lineEnding: 'cr' | 'lf' | 'crlf' | 'none'
	connectTimeout: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{ type: 'textinput', id: 'host', label: 'TuningS computer IP address or hostname', width: 8, default: '127.0.0.1' },
		{ type: 'number', id: 'port', label: 'TCP port', width: 4, min: 1, max: 65535, default: 22222 },
		{
			type: 'dropdown', id: 'lineEnding', label: 'Command terminator', width: 8, default: 'crlf',
			choices: [
				{ id: 'crlf', label: 'CR + LF (recommended)' },
				{ id: 'cr', label: 'CR' },
				{ id: 'lf', label: 'LF' },
				{ id: 'none', label: 'None' },
			],
		},
		{ type: 'number', id: 'connectTimeout', label: 'Connection timeout (ms)', width: 4, min: 1000, max: 60000, default: 5000 },
	]
}
