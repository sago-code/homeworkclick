#!/bin/bash

# Script de instalación para las pruebas de carga
# Instala las dependencias necesarias y configura el entorno

set -e

echo "=== Instalación de Pruebas de Carga - HomeworkClick ==="
echo ""

# Verificar Python
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo "Error: Python 3 no está instalado"
        echo "Por favor instala Python 3.8 o superior"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    echo "Python encontrado: $PYTHON_VERSION"
}

# Verificar pip
check_pip() {
    if ! command -v pip3 &> /dev/null; then
        echo "Error: pip3 no está instalado"
        echo "Por favor instala pip3"
        exit 1
    fi
    echo "pip3 encontrado"
}

# Instalar dependencias
install_dependencies() {
    echo "Instalando dependencias de Python..."
    pip3 install -r requirements.txt
    echo "Dependencias instaladas correctamente"
}

# Crear directorios necesarios
create_directories() {
    echo "Creando directorios necesarios..."
    mkdir -p results
    mkdir -p config
    mkdir -p scripts
    echo "Directorios creados"
}

# Verificar instalación
verify_installation() {
    echo "Verificando instalación..."
    
    if python3 -c "import locust" 2>/dev/null; then
        echo "✓ Locust instalado correctamente"
    else
        echo "✗ Error: Locust no se instaló correctamente"
        exit 1
    fi
    
    if python3 -c "import requests" 2>/dev/null; then
        echo "✓ Requests instalado correctamente"
    else
        echo "✗ Error: Requests no se instaló correctamente"
        exit 1
    fi
}

# Mostrar información de uso
show_usage_info() {
    echo ""
    echo "=== Instalación Completada ==="
    echo ""
    echo "Para ejecutar las pruebas:"
    echo "  ./scripts/run_tests.sh light    # Prueba ligera"
    echo "  ./scripts/run_tests.sh medium   # Prueba media"
    echo "  ./scripts/run_tests.sh heavy    # Prueba pesada"
    echo "  ./scripts/run_tests.sh webhook  # Solo webhook"
    echo "  ./scripts/run_tests.sh menu     # Solo menú"
    echo ""
    echo "O ejecutar manualmente:"
    echo "  locust -f locustfile.py --host=http://localhost:8080"
    echo ""
    echo "Asegúrate de que el servidor backend esté ejecutándose antes de las pruebas"
}

# Función principal
main() {
    echo "Verificando requisitos..."
    check_python
    check_pip
    
    echo ""
    echo "Configurando entorno..."
    create_directories
    install_dependencies
    
    echo ""
    echo "Verificando instalación..."
    verify_installation
    
    show_usage_info
}

# Ejecutar instalación
main
