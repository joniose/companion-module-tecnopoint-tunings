import type ModuleInstance from './main.js'

export type FeedbacksSchema = {
	cell_state: { type: 'boolean'; options: { cell: string; status: string } }
	alternation_active: { type: 'boolean'; options: Record<string, never> }
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		cell_state: {
			name: 'Cell has status',
			type: 'boolean',
			defaultStyle: { bgcolor: 0x008000, color: 0xffffff },
			options: [
				{ id: 'cell', type: 'textinput', label: 'Cell coordinate', default: 'A1' },
				{
					id: 'status',
					type: 'dropdown',
					label: 'Status',
					default: '2',
					choices: [
						{ id: '0', label: 'No sequence' },
						{ id: '1', label: 'Stopped' },
						{ id: '2', label: 'Executing' },
						{ id: '3', label: 'Cutting' },
						{ id: '4', label: 'Stopped and ready' },
					],
				},
			],
			callback: (feedback) => {
				const lastCell = String(self.getVariableValue('last_cell') ?? '').toUpperCase()
				const cell = String(feedback.options.cell).trim().toUpperCase()
				const status = String(self.getVariableValue('cell_status') ?? '')
				return lastCell === cell && status === String(feedback.options.status)
			},
		},
		alternation_active: {
			name: 'Automatic cell alternation is active',
			type: 'boolean',
			defaultStyle: { bgcolor: 0x16833b, color: 0xffffff },
			options: [],
			callback: () => self.isAlternationActive(),
		},
	})
}
