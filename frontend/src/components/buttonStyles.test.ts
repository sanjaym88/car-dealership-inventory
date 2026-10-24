import { buttonClass } from './buttonStyles'

test('every button is a pill with the same smooth easing', () => {
  for (const variant of ['solid', 'light', 'outline', 'ghost', 'success', 'danger'] as const) {
    const classes = buttonClass({ variant }).split(' ')
    expect(classes).toContain('rounded-full')
    expect(classes).toContain('ease-glide')
  }
})

test('variants look different from each other', () => {
  const variants = ['solid', 'light', 'outline', 'ghost', 'success', 'danger'] as const
  const looks = new Set(variants.map((variant) => buttonClass({ variant })))

  expect(looks.size).toBe(variants.length)
})

test('sizes set the height, and block stretches to full width', () => {
  expect(buttonClass({ size: 'lg' })).toContain('h-12')
  expect(buttonClass({ size: 'md' })).toContain('h-10')
  expect(buttonClass({ size: 'sm' })).toContain('h-9')
  expect(buttonClass({ block: true }).split(' ')).toContain('w-full')
  expect(buttonClass().split(' ')).not.toContain('w-full')
})
