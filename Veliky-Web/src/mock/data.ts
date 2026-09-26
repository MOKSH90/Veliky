import type { ActivityItem, FileNode, MemoryItem, Workspace } from '../lib/types'

// Prototype-only data. Real backend adapters can replace these exports later.
export const workspaces: Workspace[] = [
  { id: 'veliky', name: 'VELIKY Project', path: '~/Projects/VELIKY', progress: 85, tech: ['React', 'TypeScript', 'FastAPI', 'Python'] },
  { id: 'deepsafe', name: 'DeepSafe', path: '~/Projects/DeepSafe', progress: 61, tech: ['Python', 'PyTorch', 'React'] },
  { id: 'news-detector', name: 'News Detector', path: '~/Projects/news-detector', progress: 48, tech: ['Next.js', 'Python'] },
  { id: 'research', name: 'Research', path: '~/Research', progress: 32, tech: ['Markdown', 'Python'] },
]

export const fileTree: FileNode[] = [
  {
    name: 'backend', type: 'folder', path: 'backend', children: [
      { name: 'api', type: 'folder', path: 'backend/api', children: [
        { name: 'routes.py', type: 'file', path: 'backend/api/routes.py', language: 'python', content: 'from fastapi import APIRouter\n\nrouter = APIRouter()\n\n@router.get("/health")\ndef health():\n    return {"status": "ok"}\n' },
      ] },
      { name: 'services', type: 'folder', path: 'backend/services', children: Array.from({length: 40}).map((_, i) => (
        { name: 'service_'+i+'.py', type: 'file', path: 'backend/services/service_'+i+'.py', language: 'python', content: 'from backend.core.settings import Settings\nfrom backend.services.service_'+((i+1)%40)+ ' import *\n\ndef run_'+i+'(): pass' }
      )) },
      { name: 'core', type: 'folder', path: 'backend/core', children: [
        { name: 'settings.py', type: 'file', path: 'backend/core/settings.py', language: 'python', content: 'from pydantic_settings import BaseSettings\n\nclass Settings(BaseSettings):\n    app_name: str = "VELIKY"\n' },
      ] },
      { name: 'main.py', type: 'file', path: 'backend/main.py', language: 'python', content: 'from fastapi import FastAPI\nfrom api.routes import router\n\napp = FastAPI(title="VELIKY API")\napp.include_router(router)\n' },
      { name: 'config.py', type: 'file', path: 'backend/config.py', language: 'python', content: 'ENV = "development"\nPORT = 8000\n' },
    ]
  },
  { name: 'frontend', type: 'folder', path: 'frontend', children: [
    { name: 'src', type: 'folder', path: 'frontend/src', children: [
      { name: 'App.tsx', type: 'file', path: 'frontend/src/App.tsx', language: 'tsx', content: 'import { util_0 } from "./utils/util_0"\nexport default function App() {\n  return <main>VELIKY</main>\n}\n' },
      { name: 'components', type: 'folder', path: 'frontend/src/components', children: Array.from({length: 40}).map((_, i) => (
        { name: 'component_'+i+'.tsx', type: 'file', path: 'frontend/src/components/component_'+i+'.tsx', language: 'tsx', content: 'import React from "react";\nimport { component_'+((i+5)%40)+' } from "./component_'+((i+5)%40)+'";\nimport { util_'+(i%20)+' } from "../utils/util_'+(i%20)+'";\nexport default function C() { return <div/> }' }
      )) },
      { name: 'utils', type: 'folder', path: 'frontend/src/utils', children: Array.from({length: 20}).map((_, i) => (
        { name: 'util_'+i+'.ts', type: 'file', path: 'frontend/src/utils/util_'+i+'.ts', language: 'typescript', content: 'export const util_'+i+' = () => {}' }
      )) }
    ] },
  ] },
  { name: 'docs', type: 'folder', path: 'docs', children: [
    { name: 'architecture.md', type: 'file', path: 'docs/architecture.md', language: 'markdown', content: '# VELIKY Architecture\n\nSee → Understand → Plan → Reason → Act → Verify → Explain → Audit.\n' },
  ] },
  { name: 'README.md', type: 'file', path: 'README.md', language: 'markdown', content: '# VELIKY\n\nA sovereign on-premise agentic AI workbench.\n' },
  { name: 'requirements.txt', type: 'file', path: 'requirements.txt', language: 'text', content: 'fastapi==0.116.1\nuvicorn==0.35.0\npydantic-settings==2.10.1\n' },
]

export const memories: MemoryItem[] = [
  { id: 'm1', scope: 'Working', title: 'Backend startup investigation is active', subtitle: 'Project: VELIKY Project', stored: 'This session' },
  { id: 'm2', scope: 'Long-Term', title: 'VELIKY backend uses FastAPI', subtitle: 'Project: VELIKY Project', stored: 'Yesterday' },
  { id: 'm3', scope: 'Long-Term', title: 'Prefer Python for backend services', subtitle: 'Global preference', stored: '3 days ago' },
  { id: 'm4', scope: 'Knowledge', title: 'Architecture document indexed', subtitle: 'docs/architecture.md', stored: '5 days ago' },
]

export const activity: ActivityItem[] = [
  { id: 'a1', time: '11:42', title: 'Repository analysis', status: 'Verified', detail: '14 files analyzed', tool: 'inspect_workspace()', verification: 'PASSED', started: '11:42:01', finished: '11:42:09' },
  { id: 'a2', time: '11:31', title: 'Project plan generated', status: 'Completed', detail: '8 tasks created', tool: 'create_plan()', verification: 'N/A', started: '11:31:14', finished: '11:31:16' },
  { id: 'a3', time: '11:12', title: 'Dependency modification', status: 'Approved', detail: 'requirements.txt updated', tool: 'write_file()', verification: 'PASSED', started: '11:12:22', finished: '11:12:31' },
  { id: 'a4', time: '10:47', title: 'Document organization', status: 'Failed', detail: 'Verification failed · replanned', tool: 'move_files()', verification: 'FAILED', started: '10:47:03', finished: '10:47:18' },
]
