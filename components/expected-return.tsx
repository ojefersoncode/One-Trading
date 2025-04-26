interface ExpectedReturnProps {
  amount: string
  percentage: string
}

export default function ExpectedReturn({ amount, percentage }: ExpectedReturnProps) {
  return (
    <div className="p-3 bg-[#0d1117]">
      <div className="flex items-center">
        <span className="text-gray-300">Retorno esperado</span>
        <span className="ml-2 text-green-500 font-medium">
          {amount} {percentage}
        </span>
      </div>
    </div>
  )
}
