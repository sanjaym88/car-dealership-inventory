import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'

function renderSearchBar(categories = ['Sedan', 'SUV']) {
  const onSearch = vi.fn()
  const onClear = vi.fn()
  render(<SearchBar categories={categories} onSearch={onSearch} onClear={onClear} />)
  return { onSearch, onClear, user: userEvent.setup() }
}

test('submits only the filters that were filled in, with prices as numbers', async () => {
  const { onSearch, user } = renderSearchBar()

  await user.type(screen.getByLabelText(/make/i), 'Toyota')
  await user.selectOptions(screen.getByLabelText(/category/i), 'SUV')
  await user.type(screen.getByLabelText(/max price/i), '40000')
  await user.click(screen.getByRole('button', { name: /search/i }))

  expect(onSearch).toHaveBeenCalledWith({ make: 'Toyota', category: 'SUV', max_price: 40000 })
})

test('trims whitespace and ignores blank text fields', async () => {
  const { onSearch, user } = renderSearchBar()

  await user.type(screen.getByLabelText(/model/i), '  Camry  ')
  await user.type(screen.getByLabelText(/make/i), '   ')
  await user.click(screen.getByRole('button', { name: /search/i }))

  expect(onSearch).toHaveBeenCalledWith({ model: 'Camry' })
})

test('lists the known categories plus an "all" option', () => {
  renderSearchBar(['Coupe', 'Sedan'])

  const options = screen.getAllByRole('option').map((o) => o.textContent)
  expect(options).toEqual(['All categories', 'Coupe', 'Sedan'])
})

test('rejects a min price above the max price without searching', async () => {
  const { onSearch, user } = renderSearchBar()

  await user.type(screen.getByLabelText(/min price/i), '50000')
  await user.type(screen.getByLabelText(/max price/i), '10000')
  await user.click(screen.getByRole('button', { name: /search/i }))

  expect(screen.getByRole('alert')).toHaveTextContent(/min price can't be higher than max price/i)
  expect(onSearch).not.toHaveBeenCalled()
})

test('clear empties every field and notifies the parent', async () => {
  const { onClear, user } = renderSearchBar()
  await user.type(screen.getByLabelText(/make/i), 'Toyota')
  await user.type(screen.getByLabelText(/min price/i), '1000')

  await user.click(screen.getByRole('button', { name: /clear/i }))

  expect(screen.getByLabelText(/make/i)).toHaveValue('')
  expect(screen.getByLabelText(/min price/i)).toHaveValue(null)
  expect(onClear).toHaveBeenCalled()
})

test('filter sections collapse and expand', async () => {
  const { user } = renderSearchBar()
  const price = screen.getByRole('button', { name: /price/i })
  expect(price).toHaveAttribute('aria-expanded', 'true')

  await user.click(price)

  expect(price).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByLabelText(/min price/i)).not.toBeInTheDocument()
})
