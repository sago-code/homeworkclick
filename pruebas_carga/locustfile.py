"""
Archivo de pruebas de carga para HomeworkClick
Usando Locust para simular usuarios y medir el rendimiento
"""

from locust import HttpUser, task, between
import json
import random
import string

class HomeworkClickUser(HttpUser):
    wait_time = between(1, 3)  # Espera entre 1-3 segundos entre tareas
    
    def on_start(self):
        """Se ejecuta cuando un usuario virtual inicia"""
        self.username = self.generate_random_username()
        self.password = "test123456"
        self.token = None
        
        # Intentar registrarse primero
        self.register_user()
        
        # Luego hacer login
        self.login_user()
    
    def generate_random_username(self):
        """Genera un nombre de usuario aleatorio"""
        return f"test_user_{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}"
    
    def register_user(self):
        """Registra un nuevo usuario"""
        user_data = {
            "username": self.username,
            "email": f"{self.username}@test.com",
            "password": self.password,
            "nombre": f"Test User {self.username}",
            "apellido": "Load Test"
        }
        
        with self.client.post("/api/usuarios/registro", 
                            json=user_data,
                            name="Registro de Usuario",
                            catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Registro falló: {response.status_code}")
    
    def login_user(self):
        """Hace login y obtiene el token"""
        login_data = {
            "username": self.username,
            "password": self.password
        }
        
        with self.client.post("/api/usuarios/login", 
                            json=login_data,
                            name="Autenticación de Usuario",
                            catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                response.success()
            else:
                response.failure(f"Login falló: {response.status_code}")
    
    @task(3)
    def test_webhook_health(self):
        """Prueba el endpoint de salud del webhook"""
        with self.client.get("/webhook/health", 
                            name="Verificación de Salud del Sistema",
                            catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check falló: {response.status_code}")
    
    @task(2)
    def test_webhook_test(self):
        """Prueba el endpoint de test del webhook"""
        with self.client.get("/webhook/test", 
                            name="🧪 Prueba de Conectividad",
                            catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Test endpoint falló: {response.status_code}")
    
    @task(5)
    def test_chat_webhook(self):
        """Prueba el endpoint principal de chat"""
        messages = [
            "Hola, ¿cómo estás?",
            "¿Puedes ayudarme con mi tarea?",
            "Explícame sobre programación",
            "¿Qué es Spring Boot?",
            "Necesito ayuda con Java",
            "¿Cómo funciona una base de datos?",
            "Dame un ejemplo de código",
            "¿Qué es un API REST?"
        ]
        
        message_data = {
            "mensaje": random.choice(messages),
            "usuario": self.username
        }
        
        with self.client.post("/webhook/chat", 
                            json=message_data,
                            name="Prueba de Chat con IA",
                            catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Chat webhook falló: {response.status_code}")
    
    @task(2)
    def test_menu_opciones(self):
        """Prueba el endpoint de opciones del menú"""
        session_id = f"session_{random.randint(1000, 9999)}"
        
        with self.client.get(f"/api/menu/opciones?sessionId={session_id}", 
                            name="Consulta de Opciones del Menú",
                            catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Menu opciones falló: {response.status_code}")
    
    @task(1)
    def test_menu_procesar_opcion(self):
        """Prueba el procesamiento de opciones del menú"""
        if not self.token:
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        session_id = f"session_{random.randint(1000, 9999)}"
        
        # Opciones típicas del menú
        opciones = ["1", "2", "3", "4", "5"]
        opcion = random.choice(opciones)
        
        with self.client.post(f"/api/menu/procesar?optionId={opcion}&sessionId={session_id}", 
                            headers=headers,
                            name="Procesamiento de Opciones del Menú",
                            catch_response=True) as response:
            if response.status_code in [200, 400]:  # 400 puede ser válido si la opción no existe
                response.success()
            else:
                response.failure(f"Procesar opción falló: {response.status_code}")


class WebhookOnlyUser(HttpUser):
    """Usuario que solo prueba los endpoints del webhook"""
    wait_time = between(0.5, 2)
    
    def on_start(self):
        self.username = f"webhook_user_{random.randint(1000, 9999)}"
    
    @task(10)
    def test_chat_webhook(self):
        """Prueba intensiva del chat webhook"""
        messages = [
            "Hola",
            "¿Cómo estás?",
            "Ayuda",
            "Información",
            "Test",
            "Prueba",
            "¿Funciona?",
            "OK"
        ]
        
        message_data = {
            "mensaje": random.choice(messages),
            "usuario": self.username
        }
        
        with self.client.post("/webhook/chat", 
                            json=message_data,
                            name="Prueba Intensiva de Chat",
                            catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Chat webhook falló: {response.status_code}")
    
    @task(3)
    def test_health_endpoints(self):
        """Prueba los endpoints de salud"""
        endpoints = [
            ("/webhook/health", "Verificación de Salud del Sistema"),
            ("/webhook/test", "Prueba de Conectividad")
        ]
        endpoint, name = random.choice(endpoints)
        
        with self.client.get(endpoint, 
                            name=name,
                            catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health endpoint falló: {response.status_code}")


class MenuOnlyUser(HttpUser):
    """Usuario que solo prueba los endpoints del menú"""
    wait_time = between(2, 5)
    
    def on_start(self):
        self.username = f"menu_user_{random.randint(1000, 9999)}"
        self.password = "test123456"
        self.token = None
        
        # Registro y login
        self.register_and_login()
    
    def register_and_login(self):
        """Registra y hace login"""
        # Registro
        user_data = {
            "username": self.username,
            "email": f"{self.username}@test.com",
            "password": self.password,
            "nombre": f"Menu Test User {self.username}",
            "apellido": "Load Test"
        }
        
        self.client.post("/api/usuarios/registro", json=user_data)
        
        # Login
        login_data = {
            "username": self.username,
            "password": self.password
        }
        
        response = self.client.post("/api/usuarios/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
    
    @task(5)
    def test_menu_opciones(self):
        """Prueba obtener opciones del menú"""
        session_id = f"session_{random.randint(1000, 9999)}"
        
        with self.client.get(f"/api/menu/opciones?sessionId={session_id}", 
                            name="Consulta de Opciones del Menú",
                            catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Menu opciones falló: {response.status_code}")
    
    @task(3)
    def test_menu_procesar_opcion(self):
        """Prueba procesar opciones del menú"""
        if not self.token:
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        session_id = f"session_{random.randint(1000, 9999)}"
        opciones = ["1", "2", "3", "4", "5"]
        opcion = random.choice(opciones)
        
        with self.client.post(f"/api/menu/procesar?optionId={opcion}&sessionId={session_id}", 
                            headers=headers,
                            name="Procesamiento de Opciones del Menú",
                            catch_response=True) as response:
            if response.status_code in [200, 400]:
                response.success()
            else:
                response.failure(f"Procesar opción falló: {response.status_code}")
