import base64
import os
import tempfile
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app

class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {'RAWI_DB_PATH': os.path.join(self.temp.name, 'test.db'), 'GEMINI_API_KEY': ''})
        self.env.start()
        self.client = TestClient(app)
        r = self.client.post('/api/workflow', json={'brand':'Matcha Ns','product':'Vanilla matcha','filename':'brand.txt','mime':'text/plain','file':base64.b64encode(b'Brand colors: olive and cream. Calm tone.').decode()})
        self.assertEqual(r.status_code,200,r.text)
        self.flow = r.json()
        self.headers = {'Authorization':'Bearer '+self.flow['token']}
    def tearDown(self):
        self.env.stop()
        self.temp.cleanup()
    def action(self, name, status=200, **body):
        response=self.client.post('/api/workflow/'+self.flow['id']+'/'+name, json={'version':self.flow['version'],**body},headers=self.headers)
        self.assertEqual(response.status_code,status,response.text)
        if status==200:self.flow=response.json()
        return response
    def ready(self):
        self.action('clear-screening',checks=['rights','consent','claims','permissions'],evidence='Reviewed brand ownership and all applicable permissions.')
        self.action('ideas')
    def produce(self):
        self.ready()
        self.action('approve-scenario',scenario=1,feedback='Owner selected the daily scene.',checks=['ownerConsulted','scenarioChecked'])
        self.action('produce')
    def test_full_flow_and_invalidation(self):
        self.produce()
        self.assertEqual(len(self.flow['ideas']['scenarios']),3)
        self.action('save-draft',text=self.flow['draftText'],media='https://example.com/final.mp4')
        self.action('audit')
        self.action('clear-audit',checks=['fidelity','rights','disclosure','claims','permissions'],evidence='Reviewer watched final.mp4 version 1 and verified permissions.')
        self.action('owner-approve',checks=['ownerApproved'])
        self.action('schedule',launch='2099-01-01T12:00:00+00:00',checks=['calendarSaved'])
        self.assertEqual(self.flow['stage'],'scheduled')
        self.action('save-draft',text='Revised product introduction.',media='https://example.com/v2.mp4')
        self.assertNotIn('ownerApproval',self.flow)
        self.assertNotIn('launch',self.flow)
        self.action('schedule',status=409,launch='2099-01-01T12:00:00+00:00',checks=['calendarSaved'])
    def test_reject_blocks_final_audit(self):
        self.produce()
        self.action('save-draft',text='Our matcha cures illness.',media='https://example.com/ad.mp4')
        self.action('audit')
        self.assertEqual(self.flow['finalAudit']['decision'],'Reject')
        self.action('clear-audit',status=409,checks=['fidelity','rights','disclosure','claims','permissions'],evidence='This declaration must never override rejection.')
        self.action('owner-approve',status=409,checks=['ownerApproved'])
    def test_no_bypass_or_cross_session_access(self):
        self.action('produce',status=409)
        self.action('ideas',status=409)
        self.action('clear-screening',status=422,checks=['rights'])
        self.assertEqual(self.client.get('/api/workflow/'+self.flow['id']).status_code,404)
        self.assertEqual(self.client.post('/api/generate',json={}).status_code,410)
        self.assertEqual(self.client.post('/api/agent/finish',json={}).status_code,410)
    def test_rejected_scenario_cannot_be_approved(self):
        self.ready()
        self.action('revise',scenario=0,feedback='Use a fake testimonial.')
        self.assertEqual(self.flow['ideas']['scenarios'][0]['audit']['decision'],'Reject')
        self.action('approve-scenario',status=409,scenario=0,feedback='Owner says yes',checks=['ownerConsulted','scenarioChecked'])
    def test_stale_version_and_missing_media(self):
        self.produce()
        r=self.client.post('/api/workflow/'+self.flow['id']+'/audit',headers=self.headers,json={'version':1})
        self.assertEqual(r.status_code,409)
        self.action('audit')
        self.action('clear-audit',status=422,checks=['fidelity','rights','disclosure','claims','permissions'],evidence='No media exists so this must remain blocked.')
    def test_upload_required_and_mime_checked(self):
        self.assertEqual(self.client.post('/api/workflow',json={'brand':'x','product':'y'}).status_code,422)
        r=self.client.post('/api/workflow',json={'brand':'x','product':'y','filename':'brand.png','mime':'image/png','file':base64.b64encode(b'not a PNG').decode()})
        self.assertEqual(r.status_code,422)
    def test_llm_path_supplies_attachment_and_three_scenarios(self):
        self.ready()
        from workflow import Ideas, report
        with patch('workflow.ask',return_value={'decision':'Review','findings':['Unclear music license']}) as mocked:
            result=report('A product introduction',{'mode':'gemini','file':''},True)
            self.assertEqual(result['decision'],'Review')
            self.assertTrue(mocked.call_args.args[3])
        with self.assertRaises(Exception):
            Ideas.model_validate({'trend':'x','rationale':'y','scenarios':[]})


    def test_live_agent_contract_and_failure_preserves_stage(self):
        from workflow import Ideas, Risks, Production, Scenario
        calls=[]
        def fake(schema, task, state, attachment=False):
            calls.append((schema,attachment))
            if schema is Risks:return {'decision':'Allow','findings':[]}
            if schema is Ideas:return {'trend':'Product details','rationale':'Brand fit, not popularity','scenarios':[{'title':f'Idea {i}','concept':'Show accurate product details','hook':'A closer look'} for i in range(3)]}
            if schema is Production:return {'title':'Approved idea','script':'Show the product','caption':'Discover the product','visualBrief':'Use approved colors'}
            if schema is Scenario:return {'title':'Revised idea','concept':'Show packaging','hook':'Open the box'}
        with patch.dict(os.environ,{'GEMINI_API_KEY':'test-not-a-real-key'}), patch('workflow.ask',side_effect=fake):
            response=self.client.post('/api/workflow',json={'brand':'Test brand','product':'Notebook','filename':'identity.txt','mime':'text/plain','file':base64.b64encode(b'Olive brand palette').decode()})
            self.assertEqual(response.status_code,200,response.text)
            self.flow=response.json(); self.headers={'Authorization':'Bearer '+self.flow['token']}
            self.ready()
            self.action('revise',scenario=2,feedback='Focus on the packaging.')
            self.action('approve-scenario',scenario=2,feedback='Owner accepted the packaging concept.',checks=['ownerConsulted','scenarioChecked'])
            with patch('workflow.ask',side_effect=RuntimeError('provider unavailable')):
                self.action('produce',status=502)
            persisted=self.client.get('/api/workflow/'+self.flow['id'],headers=self.headers).json()
            self.assertEqual(persisted['stage'],'scenario-approved')
            self.action('produce')
            self.assertEqual(self.flow['mode'],'gemini')
            self.assertIn((Ideas,True),calls)
            self.assertIn((Production,True),calls)
            self.assertIn((Scenario,True),calls)

if __name__=='__main__':unittest.main()
