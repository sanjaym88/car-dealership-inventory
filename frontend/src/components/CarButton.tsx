// A submit button drawn as a car: the wheels spin on hover, and while the form is
// submitting the car drives off. The label is real text, so it names the button.
import { CarSilhouette } from './CarSilhouette'

export function CarButton({ label, pendingLabel, pending }: {
  label: string
  pendingLabel: string
  pending: boolean
}) {
  return (
    <button type="submit" disabled={pending} data-driving={pending ? 'true' : undefined}
      className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 px-4 pb-3 pt-4 text-white shadow-lg shadow-rose-900/20 ring-1 ring-white/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-700/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 disabled:cursor-wait">
      {/* road the car sits on */}
      <span aria-hidden="true"
        className="absolute inset-x-0 bottom-2 h-0.5 bg-[repeating-linear-gradient(90deg,#facc15_0_14px,transparent_14px_28px)] opacity-0 transition-opacity duration-300 group-hover:opacity-70 group-data-[driving]:opacity-70 group-hover:animate-road group-data-[driving]:animate-road" />
      <span className="relative mx-auto block w-40 transition-transform duration-500 ease-silk group-hover:translate-x-1.5 group-data-[driving]:animate-drive-off">
        <CarSilhouette className="w-full drop-shadow-[0_6px_10px_rgba(225,29,72,0.35)]" wheelTestId="car-wheel"
          wheelClassName="group-hover:animate-spin-wheel group-data-[driving]:animate-spin-wheel-fast" />
      </span>
      <span className="relative mt-1 block text-sm font-semibold tracking-wide">
        {pending ? pendingLabel : label}
      </span>
    </button>
  )
}
