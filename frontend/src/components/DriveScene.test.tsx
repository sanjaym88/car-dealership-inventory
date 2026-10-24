import { render, screen } from '@testing-library/react'
import { DriveScene } from './DriveScene'

test('is decorative, so screen readers skip it', () => {
  render(<DriveScene />)

  expect(screen.getByTestId('drive-scene')).toHaveAttribute('aria-hidden', 'true')
})

test('has a road, a skyline and a car with spinning wheels', () => {
  render(<DriveScene />)

  expect(screen.getByTestId('road')).toBeInTheDocument()
  expect(screen.getByTestId('skyline')).toBeInTheDocument()
  expect(screen.getAllByTestId('scene-wheel')).toHaveLength(2)
})
