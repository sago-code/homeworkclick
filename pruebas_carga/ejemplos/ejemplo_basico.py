"""
Ejemplo básico de prueba de carga con Locust
Este archivo muestra cómo crear pruebas simples paso a paso
"""

from locust import HttpUser, task, between
import json

class EjemploBasicoUser(HttpUser):
    """
    Usuario virtual básico que prueba los endpoints principales
    """
    wait_time = between(1, 3)  # Espera entre 1-3 segundos entre tareas
    
    def on_start(self):
        """Se ejecuta cuando un usuario virtual inicia"""
        print(f"Usuario virtual iniciado: {self}")
    
    @task(1)
    def test_health_check(self):
        """Prueba el endpoint de salud"""
        with self.client.get("/webhook/health", catch_response=True) as response:
            if response.status_code == 200:
                print("✓ Health check exitoso")
                response.success()
            else:
                print(f"✗ Health check falló: {response.status_code}")
                response.failure(f"Status code: {response.status_code}")
    
    @task(2)
    def test_webhook_chat(self):
        """Prueba el endpoint de chat"""
        message_data = {
            "mensaje": "Hola, ¿cómo estás?",
            "usuario": "usuario_prueba"
        }
        
        with self.client.post("/webhook/chat", 
                            json=message_data, 
                            catch_response=True) as response:
            if response.status_code == 200:
                print("✓ Chat webhook exitoso")
                response.success()
            else:
                print(f"✗ Chat webhook falló: {response.status_code}")
                response.failure(f"Status code: {response.status_code}")
    
    @task(1)
    def test_menu_opciones(self):
        """Prueba obtener opciones del menú"""
        with self.client.get("/api/menu/opciones", catch_response=True) as response:
            if response.status_code == 200:
                print("✓ Menu opciones exitoso")
                response.success()
            else:
                print(f"✗ Menu opciones falló: {response.status_code}")
                response.failure(f"Status code: {response.status_code}")


class EjemploAvanzadoUser(HttpUser):
    """
    Usuario virtual avanzado con autenticación
    """
    wait_time = between(2, 5)
    
    def on_start(self):
        """Registra y autentica al usuario"""
        self.username = f"usuario_{self.client.base_url.split('//')[1].split(':')[0]}"
        self.password = "password123"
        self.token = None
        
        # Intentar registro
        self.registrar_usuario()
        
        # Intentar login
        self.autenticar_usuario()
    
    def registrar_usuario(self):
        """Registra un nuevo usuario"""
        user_data = {
            "username": self.username,
            "email": f"{self.username}@test.com",
            "password": self.password,
            "nombre": "Usuario",
            "apellido": "Prueba"
        }
        
        with self.client.post("/api/usuarios/registro", 
                            json=user_data, 
                            catch_response=True) as response:
            if response.status_code == 200:
                print(f"✓ Usuario {self.username} registrado")
                response.success()
            else:
                print(f"✗ Registro falló para {self.username}")
                response.failure(f"Status code: {response.status_code}")
    
    def autenticar_usuario(self):
        """Autentica al usuario y obtiene token"""
        login_data = {
            "username": self.username,
            "password": self.password
        }
        
        with self.client.post("/api/usuarios/login", 
                            json=login_data, 
                            catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                print(f"✓ Usuario {self.username} autenticado")
                response.success()
            else:
                print(f"✗ Login falló para {self.username}")
                response.failure(f"Status code: {response.status_code}")
    
    @task(3)
    def test_menu_autenticado(self):
        """Prueba el menú con autenticación"""
        if not self.token:
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        with self.client.get("/api/menu/opciones", 
                           headers=headers,
                           catch_response=True) as response:
            if response.status_code == 200:
                print(f"✓ Menu autenticado exitoso para {self.username}")
                response.success()
            else:
                print(f"✗ Menu autenticado falló para {self.username}")
                response.failure(f"Status code: {response.status_code}")
    
    @task(2)
    def test_chat_personalizado(self):
        """Prueba chat con mensaje personalizado"""
        mensajes = [
            f"Hola, soy {self.username}",
            "¿Puedes ayudarme?",
            "Necesito información",
            "Gracias por tu ayuda"
        ]
        
        message_data = {
            "mensaje": mensajes[hash(self.username) % len(mensajes)],
            "usuario": self.username
        }
        
        with self.client.post("/webhook/chat", 
                            json=message_data, 
                            catch_response=True) as response:
            if response.status_code == 200:
                print(f"✓ Chat personalizado exitoso para {self.username}")
                response.success()
            else:
                print(f"✗ Chat personalizado falló para {self.username}")
                response.failure(f"Status code: {response.status_code}")


# Para ejecutar este ejemplo:
# locust -f ejemplo_basico.py --host=http://localhost:8080
