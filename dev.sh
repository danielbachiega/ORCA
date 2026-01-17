#!/bin/bash

# ORCA Development Helper Script

set -e

SERVICES=(
    "services/Orca.Catalog/Orca.Catalog.sln"
    "services/Orca.Identity/Orca.Identity.sln"
    "services/Orca.Forms/Orca.Forms.sln"
    "services/Orca.Requests/Orca.Requests.sln"
    "services/Orca.Orchestrator/Orca.Orchestrator.sln"
    "shared/Orca.Shared/Orca.Shared.sln"
)

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

restore_all() {
    print_header "Restaurando dependências de todos os serviços"
    for service in "${SERVICES[@]}"; do
        if [ -f "$service" ]; then
            DIR=$(dirname "$service")
            print_warning "Restaurando $DIR"
            cd "$DIR"
            dotnet restore
            cd - > /dev/null
        fi
    done
    print_success "Todas as dependências foram restauradas"
}

build_all() {
    print_header "Building todos os serviços"
    dotnet build Orca.sln -c Release
    print_success "Build concluído"
}

start_infra() {
    print_header "Iniciando infraestrutura (PostgreSQL, RabbitMQ, Redis)"
    docker-compose up -d postgres rabbitmq redis
    sleep 5
    docker-compose ps
    print_success "Infraestrutura iniciada"
}

stop_infra() {
    print_header "Parando infraestrutura"
    docker-compose down
    print_success "Infraestrutura parada"
}

start_all_services() {
    print_header "Iniciando todos os containers"
    docker-compose up -d
    sleep 5
    docker-compose ps
    print_success "Todos os serviços estão rodando"
}

logs_service() {
    if [ -z "$1" ]; then
        print_warning "Especifique o serviço: catalog, identity, forms, requests, orchestrator"
        return
    fi
    docker-compose logs -f "orca-${1}-api"
}

clean() {
    print_header "Limpando artifacts de build"
    find . -type d -name "bin" -o -name "obj" | xargs rm -rf
    print_success "Limpeza concluída"
}

show_help() {
    echo "ORCA Development Helper"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  restore          Restaurar dependências de todos os serviços"
    echo "  build            Build de todos os serviços (Release)"
    echo "  infra-up         Iniciar PostgreSQL, RabbitMQ, Redis"
    echo "  infra-down       Parar infraestrutura"
    echo "  up               Iniciar todos os containers"
    echo "  down             Parar todos os containers"
    echo "  logs [service]   Ver logs de um serviço"
    echo "  clean            Remover bin e obj"
    echo "  help             Mostrar esta mensagem"
    echo ""
    echo "Exemplos:"
    echo "  $0 restore"
    echo "  $0 infra-up"
    echo "  $0 logs catalog"
}

case "${1:-help}" in
    restore)
        restore_all
        ;;
    build)
        build_all
        ;;
    infra-up)
        start_infra
        ;;
    infra-down)
        stop_infra
        ;;
    up)
        start_all_services
        ;;
    down)
        stop_infra
        ;;
    logs)
        logs_service "$2"
        ;;
    clean)
        clean
        ;;
    help)
        show_help
        ;;
    *)
        echo "Comando desconhecido: $1"
        show_help
        exit 1
        ;;
esac
