import { StatusPedido } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class TransicionarPedidoDto {
    @IsEnum(StatusPedido, {
        message: `para deve ser um destes valores: ${Object.values(StatusPedido).join(', ')}`,
    })
    para!: StatusPedido;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    observacao?: string;
}