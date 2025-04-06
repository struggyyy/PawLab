import ProjectManager from './src/components/ProjectManager';

export default function Home() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="text-xl font-semibold">ManagMe</h1>
      </header>
      <div className="app-body">
        <main className="main-content-full">
          <ProjectManager />
        </main>
      </div>
    </div>
  );
}