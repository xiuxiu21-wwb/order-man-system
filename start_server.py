import http.server
import socketserver
import os
import urllib.parse
import http.client
import json

PORT = 8082

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/api'):
            self.proxy_request('GET', parsed_path)
            return
        
        if path in ['/', '/login', '/register'] or path.startswith('/elder') or path.startswith('/family'):
            self.path = '/index.html'
        
        # 管理后台页面
        if path.startswith('/admin'):
            pass  # 直接访问 admin 开头的 HTML 文件
        
        return super().do_GET()
    
    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/api'):
            self.proxy_request('POST', parsed_path)
            return
        
        if path in ['/', '/login', '/register'] or path.startswith('/elder') or path.startswith('/family'):
            self.path = '/index.html'
            return super().do_GET()
        
        return super().do_POST()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def proxy_request(self, method, parsed_path):
        try:
            conn = http.client.HTTPConnection('localhost', 8000)
            
            path = parsed_path.path
            if parsed_path.query:
                path += '?' + parsed_path.query
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b''
            
            headers = {}
            for key, value in self.headers.items():
                if key not in ['Host', 'Content-Length']:
                    headers[key] = value
            
            conn.request(method, path, body, headers)
            
            response = conn.getresponse()
            
            self.send_response(response.status)
            for key, value in response.getheaders():
                if key not in ['Content-Length', 'Transfer-Encoding']:
                    self.send_header(key, value)
            self.end_headers()
            
            self.wfile.write(response.read())
            
            conn.close()
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

project_dir = os.path.dirname(__file__)
frontend_dist_dir = os.path.join(project_dir, 'frontend', 'dist')
frontend_dir = os.path.join(project_dir, 'frontend')

if os.path.exists(frontend_dist_dir):
    os.chdir(frontend_dist_dir)
else:
    os.chdir(frontend_dir)

with socketserver.TCPServer(('', PORT), MyHTTPRequestHandler) as httpd:
    print(f"服务器运行在 http://localhost:{PORT}")
    print(f"也可以通过局域网访问: http://172.23.70.147:{PORT}")
    print("按 Ctrl+C 停止服务器")
    httpd.serve_forever()
