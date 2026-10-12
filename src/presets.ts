import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import type { CompanionPresetDefinitions, CompanionPresetSection } from '@companion-module/base'

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}
	const sequencePresets = ['START', 'STOP', 'CUT', 'CSTAT'] as const
	for (const command of sequencePresets) {
		presets[`cell_${command.toLowerCase()}`] = {
			type: 'simple',
			name: `${command} cell A1`,
			style: {
				text: `${command}\n[A1]`, size: 'auto', color: 0xffffff,
				bgcolor:
					command === 'START' ? 0x207020 : command === 'STOP' ? 0x992222 : command === 'CUT' ? 0xbb6600 : 0x225588,
				show_topbar: true,
			},
			steps: [{ down: [{ actionId: 'sequence_command', options: { command, cell: 'A1' } }], up: [] }],
			feedbacks: [],
		}
	}
	const groupPresets = ['START', 'STOP', 'CUT'] as const
	for (const command of groupPresets) {
		presets[`group_${command.toLowerCase()}`] = {
			type: 'simple',
			name: `${command} group 1`,
			style: { text: `${command}\nGRP1`, size: 'auto', color: 0xffffff, bgcolor: command === 'START' ? 0x207020 : command === 'STOP' ? 0x992222 : 0xbb6600, show_topbar: true },
			steps: [
				{
					down: [{ actionId: 'group_command', options: { command, group: 1 } }],
					up: [],
				},
			],
			feedbacks: [],
		}
	}
	const globals = [
		['GLOBSTART', 'Start selected group'],
		['GLOBSTOP', 'Stop selected group'],
		['PAUSE', 'Pause sequences'],
		['PAUSECUT', 'Pause and cut'],
		['RESUME', 'Resume sequences'],
		['EM_STOP', 'EMERGENCY STOP'],
		['GET_STA', 'Get global status'],
	] as const
	for (const [command, label] of globals) {
		presets[`global_${command.toLowerCase()}`] = {
			type: 'simple',
			name: label,
			style: {
				text: label,
				size: 'auto',
				color: 0xffffff,
				bgcolor: command === 'EM_STOP' ? 0xcc0000 : 0x444488,
				show_topbar: true,
			},
			steps: [{ down: [{ actionId: 'global_command', options: { command, group: 1 } }], up: [] }],
			feedbacks: [],
		}
	}
	presets['toggle_alternation'] = {
		type: 'simple',
		name: 'Toggle automatic A1 ↔ B1',
		style: { text: 'AUTO\nA1 ↔ B1', size: 'auto', color: 0xffffff, bgcolor: 0x444444, show_topbar: true },
		steps: [
			{
				down: [
					{ actionId: 'toggle_alternation', options: { cellA: 'A1', cellB: 'B1', firstCell: 'X', pollInterval: 1000 } },
				],
				up: [],
			},
		],
		feedbacks: [{ feedbackId: 'alternation_active', options: {}, style: { bgcolor: 0x16833b, color: 0xffffff } }],
	}
	const structure: CompanionPresetSection[] = [
		{
			id: 'sequences',
			name: 'Sequences (cell A1)',
			definitions: [
				{
					id: 'sequence_controls',
					name: 'Sequence controls',
					type: 'simple',
					presets: sequencePresets.map((c) => `cell_${c.toLowerCase()}`),
				},
			],
		},
		{
			id: 'group',
			name: 'Group controls (group 1)',
			definitions: [
				{
					id: 'group_controls',
					name: 'Group commands',
					type: 'simple',
					presets: groupPresets.map((c) => `group_${c.toLowerCase()}`),
				},
			],
		},
		{
			id: 'global',
			name: 'Global controls',
			definitions: [
				{
					id: 'global_controls',
					name: 'Global commands',
					type: 'simple',
					presets: globals.map(([c]) => `global_${c.toLowerCase()}`),
				},
			],
		},
		{
			id: 'automation',
			name: 'Automation',
			definitions: [
				{ id: 'alternation', name: 'Automatic alternation', type: 'simple', presets: ['toggle_alternation'] },
			],
		},
	]
	self.setPresetDefinitions(structure, presets)
}
