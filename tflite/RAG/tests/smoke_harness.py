#!/usr/bin/env python3
"""Keyless integration: real dsh SDK/loop/pi-ai/MCP with a scripted local SSE model.

This proves orchestration and enforcement, not local model reasoning quality.
"""
import json
import os
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from veliky_harness import ROOT, configure, run_goal
from veliky_service import BridgeConfig, VelikyService
from veliky_watcher import detect_anomalies, dispatch


class LocalModel(BaseHTTPRequestHandler):
    requests = 0
    forge_final = False
    def log_message(self,*args): pass
    def do_POST(self):
        request = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        type(self).requests += 1
        tools = [m for m in request['messages'] if m['role'] == 'tool']
        content, call = None, None
        if not tools:
            call = ('read_vault_note', {'note_title':'Inspection-Report-62'})
        elif len(tools) == 1:
            evidence = json.loads(tools[-1]['content'])
            quote = 'Baseline measurement was 2.8 mm/s RMS; current measurement is 5.4 mm/s RMS.'
            report = {'executive_summary':'Inspection reports elevated P-204 vibration.',
                      'evidence':[{'evidence_id':evidence['evidence_id'],'quote':quote}],
                      'calculations':[{'formula':'(current-baseline)/baseline*100','operands':{'current':5.4,'baseline':2.8},
                                       'claimed_result':92.85714285714288,
                                       'operand_evidence':{key:{'evidence_id':evidence['evidence_id'],'quote':quote} for key in ('current','baseline')}}],
                      'actionable_recommendations':['Review the condition with the reliability engineer.']}
            call = ('verify_evidence', {'report':report})
        else:
            verified = json.loads(tools[-1]['content'])
            report = verified['report']
            if type(self).forge_final:
                report['executive_summary'] = 'Unverified alteration after the checker ran.'
            content = json.dumps(report)
        delta = {'role':'assistant'}
        if call:
            delta['tool_calls'] = [{'index':0,'id':f'call-{len(tools)}','type':'function',
                                   'function':{'name':'mcp__veliky__'+call[0],'arguments':json.dumps(call[1])}}]
        else:
            delta['content'] = content
        chunk = {'id':'local-test','object':'chat.completion.chunk','created':1,'model':'veliky-test',
                 'choices':[{'index':0,'delta':delta,'finish_reason':None}]}
        finish = {**chunk,'choices':[{'index':0,'delta':{},'finish_reason':'tool_calls' if call else 'stop'}],
                  'usage':{'prompt_tokens':100,'completion_tokens':100,'total_tokens':200}}
        body = ''.join('data: '+json.dumps(c)+'\n\n' for c in (chunk,finish))+'data: [DONE]\n\n'
        self.send_response(200)
        self.send_header('Content-Type','text/event-stream')
        self.send_header('Content-Length',str(len(body.encode())))
        self.end_headers()
        self.wfile.write(body.encode())


def main():
    with tempfile.TemporaryDirectory(prefix='veliky-e2e-') as folder:
        temp = Path(folder)
        os.environ['VELIKY_STATE_DIR'] = str(temp/'state')
        os.environ['VELIKY_RETRIEVAL'] = 'vault'
        server = ThreadingHTTPServer(('127.0.0.1',0),LocalModel)
        thread = threading.Thread(target=server.serve_forever,daemon=True)
        thread.start()
        try:
            patch = configure(temp/'patch.yml',f'http://127.0.0.1:{server.server_port}/v1','veliky-test',retrieval='vault')
            service = VelikyService(BridgeConfig())
            def launch(prompt,session_id=None):
                return run_goal(prompt,patch=patch,home=temp/'dsh-home',model='veliky-test',
                    dsh_bin=str(ROOT/'RAG/harness/dsh-source'),session_id=session_id,service=service)
            result = launch('Investigate Pump P-204.')
            assert result['report']['verification']['status'] == 'VERIFIED'
            alerts = detect_anomalies(service.query_sensor_history('P-204')['readings'],4.5)
            outcome = dispatch(service,alerts[0],launch)
            assert outcome['status'] == 'completed'
            LocalModel.forge_final = True
            try:
                launch('Attempt an altered final report.')
            except RuntimeError as exc:
                assert 'verification gate' in str(exc), str(exc)
            else:
                raise AssertionError('Harness accepted an altered final report')
            print(json.dumps({'altered_final':'REJECTED','typed':'VERIFIED','sensor':'VERIFIED','model_requests':LocalModel.requests,
                              'tools':'real harness MCP stdio','inference':'scripted local fixture'}))
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)


if __name__ == '__main__':
    main()
