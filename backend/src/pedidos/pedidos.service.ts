import {
    Injectable,
    NotImplementedException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, StatusPedido } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { anoAtualBrasil, formatarNumeroProtocolo } from './dominio/protocolo';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { ListarPedidosQueryDto } from './dto/listar-pedidos.query';
import { TransicionarPedidoDto } from './dto/transicionar-pedido.dto';

@Injectable()
export class PedidosService {
    constructor(private readonly prisma: PrismaService) { }

    async criar(dto: CriarPedidoDto) {
        const tipo = await this.prisma.tipoPedido.findUnique({ where: { id: dto.tipoId } });
        if (!tipo) {
            throw new UnprocessableEntityException(`Tipo de pedido ${dto.tipoId} não encontrado`);
        }

        const ano = anoAtualBrasil();

        return this.prisma.$transaction(
            async (tx) => {
                const sequencial = await this.proximoSequencial(tx, ano);

                return tx.pedido.create({
                    data: {
                        ano,
                        sequencial,
                        numeroProtocolo: formatarNumeroProtocolo(ano, sequencial),
                        tipoId: dto.tipoId,
                        solicitanteNome: dto.solicitanteNome,
                        solicitanteDocumento: dto.solicitanteDocumento,
                        descricao: dto.descricao,
                        prioridade: dto.prioridade,
                        historico: {
                            create: { statusOrigem: null, statusDestino: StatusPedido.PROTOCOLADO },
                        },
                    },
                    include: { tipo: true, historico: true },
                });
            },
            { maxWait: 5_000, timeout: 10_000 },
        );
    }

    /**
     * Incrementa o contador do ano de forma atômica e devolve o novo valor.
     *
     * O ON CONFLICT ... DO UPDATE trava a linha do ano até o fim da transação:
     * criações simultâneas esperam na fila e cada uma recebe o próximo número.
     * Se a transação falhar, o incremento é desfeito junto, então nenhum número é perdido.
     */
    private async proximoSequencial(tx: Prisma.TransactionClient, ano: number): Promise<number> {
        const [contador] = await tx.$queryRaw<{ ultimo: number }[]>`
      INSERT INTO contador_protocolo (ano, ultimo)
      VALUES (${ano}, 1)
      ON CONFLICT (ano) DO UPDATE SET ultimo = contador_protocolo.ultimo + 1
      RETURNING ultimo
    `;
        return contador.ultimo;
    }

    listar(query: ListarPedidosQueryDto) {
        throw new NotImplementedException('Implementado na etapa 5');
    }

    buscarPorId(id: string) {
        throw new NotImplementedException('Implementado na etapa 6');
    }

    transicionar(id: string, dto: TransicionarPedidoDto) {
        throw new NotImplementedException('Implementado na etapa 4');
    }
}