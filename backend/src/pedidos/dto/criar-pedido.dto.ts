import { Prioridade } from '@prisma/client';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    Min,
} from 'class-validator';

export class CriarPedidoDto {
    @IsInt({ message: 'tipoId deve ser um número inteiro' })
    @Min(1, { message: 'tipoId deve ser maior que zero' })
    tipoId!: number;

    @IsString()
    @IsNotEmpty({ message: 'solicitanteNome é obrigatório' })
    @MaxLength(150)
    solicitanteNome!: string;

    @IsOptional()
    @Matches(/^(\d{11}|\d{14})$/, {
        message: 'solicitanteDocumento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos), apenas números',
    })
    solicitanteDocumento?: string;

    @IsString()
    @IsNotEmpty({ message: 'descricao é obrigatória' })
    @MaxLength(2000)
    descricao!: string;

    @IsOptional()
    @IsEnum(Prioridade, {
        message: `prioridade deve ser um destes valores: ${Object.values(Prioridade).join(', ')}`,
    })
    prioridade?: Prioridade;
}