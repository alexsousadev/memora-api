// Função para determinar o ícone do Bootstrap baseado no nome do lembrete
export function getReminderIcon(reminderName: string): string {
  const name = reminderName.toLowerCase();
  
  // Ícones por categoria usando Bootstrap Icons
  if (name.includes('médico') || name.includes('medico') || name.includes('consulta') || name.includes('dentista') || name.includes('exame')) {
    return 'bi-hospital';
  }
  if (name.includes('reunião') || name.includes('reuniao') || name.includes('meeting') || name.includes('call')) {
    return 'bi-people';
  }
  if (name.includes('aniversário') || name.includes('aniversario') || name.includes('festa') || name.includes('comemoração') || name.includes('comemoracao')) {
    return 'bi-balloon';
  }
  if (name.includes('exercício') || name.includes('exercicio') || name.includes('academia') || name.includes('treino') || name.includes('corrida') || name.includes('yoga')) {
    return 'bi-activity';
  }
  if (name.includes('remédio') || name.includes('remedio') || name.includes('medicamento') || name.includes('comprimido')) {
    return 'bi-capsule';
  }
  if (name.includes('compra') || name.includes('mercado') || name.includes('supermercado') || name.includes('farmácia') || name.includes('farmacia')) {
    return 'bi-cart';
  }
  if (name.includes('comida') || name.includes('almoço') || name.includes('almoco') || name.includes('jantar') || name.includes('café') || name.includes('cafe') || name.includes('restaurante')) {
    return 'bi-egg-fried';
  }
  if (name.includes('viagem') || name.includes('voo') || name.includes('hotel') || name.includes('férias') || name.includes('ferias')) {
    return 'bi-airplane';
  }
  if (name.includes('trabalho') || name.includes('projeto') || name.includes('entrega') || name.includes('deadline')) {
    return 'bi-briefcase';
  }
  if (name.includes('estudo') || name.includes('prova') || name.includes('aula') || name.includes('curso') || name.includes('faculdade')) {
    return 'bi-book';
  }
  if (name.includes('casa') || name.includes('limpar') || name.includes('limpeza') || name.includes('arrumar') || name.includes('organizar')) {
    return 'bi-house';
  }
  if (name.includes('carro') || name.includes('manutenção') || name.includes('manutencao') || name.includes('mecânico') || name.includes('mecanico') || name.includes('combustível') || name.includes('combustivel')) {
    return 'bi-car-front';
  }
  if (name.includes('dinheiro') || name.includes('conta') || name.includes('boleto') || name.includes('pagar') || name.includes('pagamento') || name.includes('banco')) {
    return 'bi-currency-dollar';
  }
  if (name.includes('pet') || name.includes('cachorro') || name.includes('gato') || name.includes('veterinário') || name.includes('veterinario')) {
    return 'bi-heart';
  }
  if (name.includes('água') || name.includes('agua') || name.includes('beber') || name.includes('hidratar')) {
    return 'bi-droplet';
  }
  if (name.includes('filme') || name.includes('série') || name.includes('serie') || name.includes('tv') || name.includes('netflix')) {
    return 'bi-film';
  }
  if (name.includes('livro') || name.includes('ler') || name.includes('leitura')) {
    return 'bi-journal-text';
  }
  if (name.includes('telefonema') || name.includes('ligar') || name.includes('telefone') || name.includes('celular')) {
    return 'bi-telephone';
  }
  if (name.includes('email') || name.includes('e-mail') || name.includes('mensagem')) {
    return 'bi-envelope';
  }
  
  // Ícone padrão
  return 'bi-clock';
}

