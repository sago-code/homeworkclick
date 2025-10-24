#!/bin/bash

# Script para ejecutar pruebas de carga automatizadas
# Uso: ./run_tests.sh [tipo_prueba] [usuarios] [duracion]

set -e

# Configuración por defecto
HOST="http://localhost:8080"
RESULTS_DIR="results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [tipo_prueba] [usuarios] [duracion]"
    echo ""
    echo "Tipos de prueba:"
    echo "  light    - Prueba ligera (10 usuarios, 1 minuto)"
    echo "  medium   - Prueba media (50 usuarios, 5 minutos)"
    echo "  heavy    - Prueba pesada (100 usuarios, 10 minutos)"
    echo "  webhook  - Solo endpoints de webhook (20 usuarios, 2 minutos)"
    echo "  menu     - Solo endpoints de menú (15 usuarios, 3 minutos)"
    echo ""
    echo "Parámetros opcionales:"
    echo "  usuarios - Número de usuarios virtuales"
    echo "  duracion - Duración en segundos"
    echo ""
    echo "Ejemplos:"
    echo "  $0 light"
    echo "  $0 medium 30 180"
    echo "  $0 webhook"
}

# Verificar que Locust esté instalado
check_locust() {
    if ! command -v locust &> /dev/null; then
        echo "Error: Locust no está instalado"
        echo "Instala con: pip install -r requirements.txt"
        exit 1
    fi
}

# Crear directorio de resultados
create_results_dir() {
    mkdir -p "$RESULTS_DIR"
}

# Ejecutar prueba ligera
run_light_test() {
    echo "Ejecutando prueba ligera..."
    locust -f locustfile.py \
        --host="$HOST" \
        --headless \
        -u 10 \
        -r 2 \
        -t 60s \
        --csv="$RESULTS_DIR/light_test_$TIMESTAMP" \
        --html="$RESULTS_DIR/light_test_$TIMESTAMP.html"
}

# Ejecutar prueba media
run_medium_test() {
    echo "Ejecutando prueba media..."
    locust -f locustfile.py \
        --host="$HOST" \
        --headless \
        -u 50 \
        -r 5 \
        -t 300s \
        --csv="$RESULTS_DIR/medium_test_$TIMESTAMP" \
        --html="$RESULTS_DIR/medium_test_$TIMESTAMP.html"
}

# Ejecutar prueba pesada
run_heavy_test() {
    echo "Ejecutando prueba pesada..."
    locust -f locustfile.py \
        --host="$HOST" \
        --headless \
        -u 100 \
        -r 10 \
        -t 600s \
        --csv="$RESULTS_DIR/heavy_test_$TIMESTAMP" \
        --html="$RESULTS_DIR/heavy_test_$TIMESTAMP.html"
}

# Ejecutar prueba de webhook
run_webhook_test() {
    echo "Ejecutando prueba de webhook..."
    locust -f locustfile.py \
        --host="$HOST" \
        --headless \
        -u 20 \
        -r 2 \
        -t 120s \
        --class WebhookOnlyUser \
        --csv="$RESULTS_DIR/webhook_test_$TIMESTAMP" \
        --html="$RESULTS_DIR/webhook_test_$TIMESTAMP.html"
}

# Ejecutar prueba de menú
run_menu_test() {
    echo "Ejecutando prueba de menú..."
    locust -f locustfile.py \
        --host="$HOST" \
        --headless \
        -u 15 \
        -r 1 \
        -t 180s \
        --class MenuOnlyUser \
        --csv="$RESULTS_DIR/menu_test_$TIMESTAMP" \
        --html="$RESULTS_DIR/menu_test_$TIMESTAMP.html"
}

# Ejecutar prueba personalizada
run_custom_test() {
    local users=$1
    local duration=$2
    
    echo "Ejecutando prueba personalizada: $users usuarios por ${duration}s..."
    locust -f locustfile.py \
        --host="$HOST" \
        --headless \
        -u "$users" \
        -r 2 \
        -t "${duration}s" \
        --csv="$RESULTS_DIR/custom_test_$TIMESTAMP" \
        --html="$RESULTS_DIR/custom_test_$TIMESTAMP.html"
}

# Verificar que el servidor esté ejecutándose
check_server() {
    echo "Verificando que el servidor esté ejecutándose..."
    if ! curl -s "$HOST/webhook/health" > /dev/null; then
        echo "Error: No se puede conectar al servidor en $HOST"
        echo "Asegúrate de que el backend esté ejecutándose en el puerto 8080"
        exit 1
    fi
    echo "Servidor OK"
}

# Función principal
main() {
    # Verificaciones iniciales
    check_locust
    check_server
    create_results_dir
    
    # Procesar argumentos
    case "${1:-light}" in
        "light")
            run_light_test
            ;;
        "medium")
            run_medium_test
            ;;
        "heavy")
            run_heavy_test
            ;;
        "webhook")
            run_webhook_test
            ;;
        "menu")
            run_menu_test
            ;;
        "custom")
            if [ -z "$2" ] || [ -z "$3" ]; then
                echo "Error: Para prueba personalizada necesitas especificar usuarios y duración"
                echo "Uso: $0 custom [usuarios] [duracion]"
                exit 1
            fi
            run_custom_test "$2" "$3"
            ;;
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        *)
            echo "Error: Tipo de prueba no reconocido: $1"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    echo "Prueba completada. Resultados guardados en: $RESULTS_DIR/"
    echo "Reporte HTML: $RESULTS_DIR/*_test_$TIMESTAMP.html"
}

# Ejecutar función principal
main "$@"
