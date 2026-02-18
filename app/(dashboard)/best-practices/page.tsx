export const metadata = {
  title: 'Best Practices - Digital TaskOps',
};

export default function BestPracticesPage() {
  const practices = [
    {
      title: 'Task Documentation',
      description: 'Always include clear task descriptions and acceptance criteria',
      icon: '📝',
    },
    {
      title: 'Time Tracking',
      description: 'Log your time regularly to maintain accurate project metrics',
      icon: '⏱️',
    },
    {
      title: 'Evidence Submission',
      description: 'Submit evidence immediately after task completion for faster review',
      icon: '✓',
    },
    {
      title: 'Communication',
      description: 'Use task comments to communicate with team members',
      icon: '💬',
    },
    {
      title: 'Quality First',
      description: 'Always prioritize quality over speed in task execution',
      icon: '⭐',
    },
    {
      title: 'Continuous Learning',
      description: 'Share insights and lessons learned with the team',
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
