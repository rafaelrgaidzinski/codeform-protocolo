import {
    ConflictException,
    Injectable,
    NotFoundException,
    NotImplementedException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, StatusPedido } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
    TransicaoInvalidaError,
    transicoesPermitidas,
    validarTransicao,
} from './dominio/maquina-estados';
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

    async transicionar(id: string, dto: TransicionarPedidoDto) {
        return this.prisma.$transaction(async (tx) => {
            const pedido = await tx.pedido.findUnique({
                where: { id },
                select: { status: true },
            });
            if (!pedido) {
                throw new NotFoundException(`Pedido ${id} não encontrado`);
            }

            this.garantirTransicaoValida(pedido.status, dto.para);

            const { count } = await tx.pedido.updateMany({
                where: { id, status: pedido.status },
                data: { status: dto.para },
            });
            if (count === 0) {
                throw new ConflictException(
                    'O pedido foi alterado por outra operação ao mesmo tempo. Recarregue e tente novamente.',
                );
            }

            await tx.historicoMovimentacao.create({
                data: {
                    pedidoId: id,
                    statusOrigem: pedido.status,
                    statusDestino: dto.para,
                    observacao: dto.observacao,
                },
            });

            return tx.pedido.findUniqueOrThrow({
                where: { id },
                include: {
                    tipo: true,
                    historico: { orderBy: { criadoEm: 'asc' } },
                },
            });
        });
    }

    listar(query: ListarPedidosQueryDto) {
        throw new NotImplementedException('Implementado na etapa 5');
    }

    buscarPorId(id: string) {
        throw new NotImplementedException('Implementado na etapa 6');
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

    /**
     * Traduz a regra do domínio para a linguagem HTTP.
     * A máquina de estados não conhece HTTP; é aqui que o erro dela vira um 422.
     */
    private garantirTransicaoValida(de: StatusPedido, para: StatusPedido): void {
        try {
            validarTransicao(de, para);
        } catch (erro) {
            if (erro instanceof TransicaoInvalidaError) {
                throw new UnprocessableEntityException({
                    statusCode: 422,
                    error: 'Unprocessable Entity',
                    message: erro.message,
                    statusAtual: de,
                    transicoesPermitidas: transicoesPermitidas(de),
                });
            }
            throw erro;
        }
    }
}