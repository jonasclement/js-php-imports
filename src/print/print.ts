import { GroupUse, GroupedUses, SingleUse } from '../group'

import { PrintConfig } from '.'


const CONFIG_DEFAULTS: PrintConfig = {
	indent: ' '.repeat(4),
	order: [
		'singleUses.class',
		'emptyLine',
		'singleUses.function',
		'singleUses.const',
		'emptyLine',
		'groupedUses.class',
		'emptyLine',
		'groupedUses.function',
		'groupedUses.const',
	],
	wrap: true,
}

export default (
	grouped: GroupedUses,
	config: Partial<PrintConfig> = {},
): string => {
	const {
		indent,
		order,
		wrap,
	} = { ...CONFIG_DEFAULTS, ...config }

	const printSingleUse = (use: SingleUse): string => (
		`use${use.modifier ? ` ${use.modifier}` : ''} ${use.path.join('\\')}${use.alias ? ` as ${use.alias}` : ''};`
	)

	let wrapLimit: number

	switch (typeof wrap) {
	case 'object':
		wrapLimit = wrap.limit
		break

	case 'number':
		wrapLimit = wrap
		break

	case 'boolean':
		if (wrap) {
			wrapLimit = 0
		} else {
			wrapLimit = Infinity
		}
	}

	const printGroupUse = (use: GroupUse): string => {
		const itemStrings = use.items.map((it, i) => (
			`${it.modifier ? `${it.modifier} ` : ''}${it.path.join('\\')}${it.alias ? ` as ${it.alias}` : ''}${i === use.items.length - 1 ? '' : ','}`
		))

		const headerString = `use${use.modifier ? ` ${use.modifier}` : ''} ${use.path.join('\\')}\\{`

		const notWrappedLength = headerString.length
			+ itemStrings.reduce((acc, item) => acc + item.length, 0)
			+ (itemStrings.length - 1)
			+ '};'.length

		const shouldWrap = notWrappedLength > wrapLimit

		if (shouldWrap) {
			if (typeof wrap === 'object' && !wrap.all) {
				return [
					headerString,
					...itemStrings
						.reduce((acc, item) => {
							if (acc.length === 0 || acc[acc.length - 1].length + 1 + item.length > wrapLimit) {
								return [
									...acc,
									`${indent}${item}`,
								]
							} else {
								return [
									...acc.slice(0, -1),
									`${acc[acc.length - 1]} ${item}`,
								]
							}
						}, [] as string[]),
					'};',
				].join('\n')
			} else {
				return [
					headerString,
					...itemStrings.map(item => `${indent}${item}`),
					'};',
				].join('\n')
			}
		} else {
			return `${headerString}${itemStrings.join(' ')}};`
		}
	}

	const printUse = (use: SingleUse | GroupUse): string => (
		use.type === 'single'
			? printSingleUse(use)
			: printGroupUse(use)
	)

	let parts = []

	for (const item of order) {
		switch (item) {
		case 'emptyLine':
			parts.push('emptyLine')
			break

		case 'all.all':
			parts.push(
				grouped.items
					.map(it => printUse(it))
					.join('\n'),
			)
			break

		case 'all.class':
			parts.push(
				grouped.items
					.filter(it => it.modifier === null)
					.map(it => it.type === 'single'
						? it
						: ({
							...it,
							items: it.items.filter(item => item.modifier === null),
						}),
					)
					.filter(it => it.type === 'single' || it.items.length !== 0)
					.map(it => printUse(it))
					.join('\n'),
			)
			break

		case 'all.function':
			parts.push(
				grouped.items
					.filter(it => it.modifier === null || it.modifier === 'function')
					.map(it => it.type === 'single' || it.modifier === 'function'
						? it
						: ({
							...it,
							items: it.items.filter(item => item.modifier === 'function'),
						}),
					)
					.filter(it => it.type === 'single' || it.items.length !== 0)
					.map(it => printUse(it))
					.join('\n'),
			)
			break

		case 'all.const':
			parts.push(
				grouped.items
					.filter(it => it.modifier === null || it.modifier === 'const')
					.map(it => it.type === 'single' || it.modifier === 'const'
						? it
						: ({
							...it,
							items: it.items.filter(item => item.modifier === 'const'),
						}),
					)
					.filter(it => it.type === 'single' || it.items.length !== 0)
					.map(it => printUse(it))
					.join('\n'),
			)
			break

		case 'singleUses.all':
			parts.push(
				grouped.items
					.filter((it): it is SingleUse => it.type === 'single')
					.map(it => printSingleUse(it))
					.join('\n'),
			)
			break

		case 'singleUses.class':
			parts.push(
				grouped.items
					.filter((it): it is SingleUse => it.type === 'single')
					.filter(it => it.modifier === null)
					.map(it => printSingleUse(it))
					.join('\n'),
			)
			break

		case 'singleUses.function':
			parts.push(
				grouped.items
					.filter((it): it is SingleUse => it.type === 'single')
					.filter(it => it.modifier === 'function')
					.map(it => printSingleUse(it))
					.join('\n'),
			)
			break

		case 'singleUses.const':
			parts.push(
				grouped.items
					.filter((it): it is SingleUse => it.type === 'single')
					.filter(it => it.modifier === 'const')
					.map(it => printSingleUse(it))
					.join('\n'),
			)
			break

		case 'groupedUses.all':
			parts.push(
				grouped.items
					.filter((it): it is GroupUse => it.type === 'group')
					.map(it => printGroupUse(it))
					.join('\n'),
			)
			break

		case 'groupedUses.class':
			parts.push(
				grouped.items
					.filter((it): it is GroupUse => it.type === 'group')
					.filter(it => it.modifier === null)
					.map(it => ({
						...it,
						items: it.items.filter(item => item.modifier === null),
					}))
					.filter(it => it.items.length !== 0)
					.map(it => printGroupUse(it))
					.join('\n'),
			)
			break

		case 'groupedUses.function':
			parts.push(
				grouped.items
					.filter((it): it is GroupUse => it.type === 'group')
					.map(it => ({
						...it,
						items: it.items.filter(item => (
							item.modifier === 'function' ||
								(item.modifier === null && it.modifier === 'function')
						)),
					}))
					.filter(it => it.items.length !== 0)
					.map(it => printGroupUse(it))
					.join('\n'),
			)
			break

		case 'groupedUses.const':
			parts.push(
				grouped.items
					.filter((it): it is GroupUse => it.type === 'group')
					.map(it => ({
						...it,
						items: it.items.filter(item => (
							item.modifier === 'const' ||
								(item.modifier === null && it.modifier === 'const')
						)),
					}))
					.filter(it => it.items.length !== 0)
					.map(it => printGroupUse(it))
					.join('\n'),
			)
			break
		}
	}

	parts = parts
		.filter(it => it.length > 0)
		.map(it => it === 'emptyLine' ? '' : it)

	const resultParts = []

	for (const part of parts) {
		if (part === '') {
			if (resultParts.length === 0 || resultParts[resultParts.length - 1] === '') {
				continue
			}
		}

		resultParts.push(part)
	}

	while (resultParts.length && resultParts[resultParts.length - 1] === '') {
		resultParts.pop()
	}

	return resultParts.join('\n')
}
