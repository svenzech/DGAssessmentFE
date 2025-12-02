import { Suspense } from 'react';
import { FlowiseChat } from '../components/FlowiseChat';

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
          <div className="text-sm text-gray-500">
            Chat wird geladen …
          </div>
        </main>
      }
    >
      <FlowiseChat />
    </Suspense>
  );
}