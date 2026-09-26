import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tipos = [
    { codigo: 'SEGUNDA_VIA_CERTIDAO', nome: 'Segunda via de certidão', descricao: 'Emissão de segunda via de certidão de nascimento, casamento ou óbito' },
    { codigo: 'LAVRATURA_ESCRITURA', nome: 'Lavratura de escritura', descricao: 'Lavratura de escritura pública (compra e venda, doação, inventário)' },
    { codigo: 'RECONHECIMENTO_FIRMA', nome: 'Reconhecimento de firma', descricao: 'Reconhecimento de firma por semelhança ou autenticidade' },
    { codigo: 'AUTENTICACAO_COPIA', nome: 'Autenticação de cópia', descricao: 'Autenticação de cópia de documento' },
    { codigo: 'PROCURACAO', nome: 'Procuração pública', descricao: 'Lavratura de procuração pública' },
];

async function main() {
    for (const tipo of tipos) {
        await prisma.tipoPedido.upsert({
            where: { codigo: tipo.codigo },
            update: { nome: tipo.nome, descricao: tipo.descricao },
            create: tipo,
        });
    }
    console.log(`Seed concluído: ${tipos.length} tipos de pedido.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());