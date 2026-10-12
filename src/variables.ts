import type ModuleInstance from './main.js'

export type VariablesSchema = {
	last_response: string
	last_cell: string
	cell_status: string
	alternation_status: string
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions({
		last_response: { name: 'Last TCP response' },
		last_cell: { name: 'Last cell queried' },
		cell_status: { name: 'Last cell status (0-4)' },
		alternation_status: { name: 'Automatic alternation status' },
	})
}
