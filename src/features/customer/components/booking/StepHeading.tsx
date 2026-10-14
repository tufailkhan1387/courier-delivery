export function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-0.5 text-sm text-gray-500">{description}</p>
    </div>
  )
}
