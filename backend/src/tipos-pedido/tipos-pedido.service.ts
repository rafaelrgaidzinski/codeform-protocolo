import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TiposPedidoService {
    constructor(private readonly prisma: PrismaService) { }

    listar() {
        return this.prisma.tipoPedido.findMany({ orderBy: { nome: 'asc' } });
    }
}