import { STATUS_ESTILO, STATUS_LABEL, type StatusPedido } from '@/lib/tipos';

export function StatusBadge({ status }: { status: StatusPedido }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_ESTILO[status]}`}
        >
            {STATUS_LABEL[status]}
        </span>
    );
}