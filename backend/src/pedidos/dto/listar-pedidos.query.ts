import { StatusPedido } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListarPedidosQueryDto {
    @IsOptional()
    @IsEnum(StatusPedido)
    status?: StatusPedido;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    tipoId?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    busca?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    porPagina: number = 20;
}