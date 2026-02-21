export const metadata = {
  title: 'Melhores Práticas - Digital TaskOps',
};

export default function BestPracticesPage() {
  const practices = [
    {
      title: 'Documentação de Tarefas',
      description: 'Sempre inclua descrições claras e critérios de aceitação nas tarefas',
      icon: '📝',
    },
    {
      title: 'Registro de Tempo',
      description: 'Registre seu tempo regularmente para manter métricas precisas do projeto',
      icon: '⏱️',
    },
    {
      title: 'Submissão de Evidências',
      description: 'Envie evidências imediatamente após conclusão para revisão mais rápida',
      icon: '✓',
    },
    {
      title: 'Comunicação',
      description: 'Use comentários em tarefas para se comunicar com os membros do time',
      icon: '💬',
    },
    {
      title: 'Qualidade em Primeiro',
      description: 'Sempre priorize qualidade sobre velocidade na execução de tarefas',
      icon: '⭐',
    },
    {
      title: 'Aprendizado Contínuo',
      description: 'Compartilhe insights e lições aprendidas com o time',
      icon: '📚',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Melhores Práticas</h1>
      <p className="text-gray-600 mb-8">Guia de boas práticas para máxima eficiência e qualidade</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {practices.map((practice) => (
          <div key={practice.title} className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl mb-4">{practice.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{practice.title}</h3>
            <p className="text-gray-600 text-sm">{practice.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
