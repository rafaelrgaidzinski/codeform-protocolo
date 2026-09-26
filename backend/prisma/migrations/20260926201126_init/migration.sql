-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('PROTOCOLADO', 'EM_ANALISE', 'EM_EXIGENCIA', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateTable
CREATE TABLE "tipos_pedido" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "tipos_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "sequencial" INTEGER NOT NULL,
    "numero_protocolo" TEXT NOT NULL,
    "tipo_id" INTEGER NOT NULL,
    "solicitante_nome" TEXT NOT NULL,
    "solicitante_documento" TEXT,
    "descricao" TEXT NOT NULL,
    "prioridade" "Prioridade" NOT NULL DEFAULT 'NORMAL',
    "status" "StatusPedido" NOT NULL DEFAULT 'PROTOCOLADO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_movimentacoes" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "status_origem" "StatusPedido",
    "status_destino" "StatusPedido" NOT NULL,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contador_protocolo" (
    "ano" INTEGER NOT NULL,
    "ultimo" INTEGER NOT NULL,

    CONSTRAINT "contador_protocolo_pkey" PRIMARY KEY ("ano")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_pedido_codigo_key" ON "tipos_pedido"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_pedido_nome_key" ON "tipos_pedido"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_protocolo_key" ON "pedidos"("numero_protocolo");

-- CreateIndex
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "pedidos_tipo_id_idx" ON "pedidos"("tipo_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_ano_sequencial_key" ON "pedidos"("ano", "sequencial");

-- CreateIndex
CREATE INDEX "historico_movimentacoes_pedido_id_idx" ON "historico_movimentacoes"("pedido_id");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "tipos_pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_movimentacoes" ADD CONSTRAINT "historico_movimentacoes_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
