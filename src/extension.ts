import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {

  const disposable = vscode.commands.registerCommand('deepseek.deepseek', () => {

    vscode.window.showInformationMessage('Starting DeepChat...');
    const panel = vscode.window.createWebviewPanel(
      'deepchat',
      'DeepChat',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'chat') {
        const prompt = message.prompt;
        let response = '';

        try {
          const stream = await ollama.chat({
            model: 'deepseek-r1:1.5b',
            messages: [{ role: 'user', content: prompt }],
            stream: true,
          });

          for await (const chunk of stream) {
            response += chunk.message.content;
            panel.webview.postMessage({ command: 'chatResponse', text: response });
          }
        } catch (error) {
          panel.webview.postMessage({ command: 'chatResponse', error: `Error: ${error}` });
        }
      }
    });

  });

  context.subscriptions.push(disposable);
}

function getWebviewContent() {
  return /*html*/`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: sans-serif; margin: 1rem; }
        #prompt { width: 100%; box-sizing: border-box; }
        #response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; min-height: 100px; }
      </style>
    </head>
    <body>
      <h2>DeepChat</h2>
      <textarea id="prompt" rows="3" placeholder="Ask something..."></textarea>
      <button id="submit">Submit</button>
      <div id="response"></div>

      <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('submit').addEventListener('click', () => {
          const prompt = document.getElementById('prompt').value;
          vscode.postMessage({ command: 'chat', prompt });
        })

        window.addEventListener('message', event => {
          const { command, text } = event.data;
          if (command === 'chatResponse') {
            document.getElementById('response').innerText = text;
          }
        })
      </script>
    </body>
    </html>
  `;
}

export function deactivate() {}