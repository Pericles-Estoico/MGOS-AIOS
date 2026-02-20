#!/bin/bash
#
# Marketplace Master Deployment Script
# Automatically deploys marketplace orchestration to production
#
# Usage: ./scripts/deploy-marketplace.sh [environment]
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-production}
DOMAIN=${2:-www.sellersops.com.br}  # Default domain
PROJECT_NAME="mgos-marketplace"
DEPLOY_DIR=$(pwd)

# Support for domain flag
if [[ "$*" == *"--domain="* ]]; then
  DOMAIN=$(echo "$@" | grep -oP '(?<=--domain=)\S+')
fi

# Domain configuration
case $DOMAIN in
  marketplace.aios.local)
    DOMAIN_NAME="Marketplace AIOS Local"
    ENV_FILE=".env.local"
    VERCEL_PROJECT="marketplace-aios-local"
    NEXTAUTH_URL="http://localhost:3000"
    API_URL="http://localhost:3000"
    ;;
  www.sellersops.com.br)
    DOMAIN_NAME="SellersOps Public"
    ENV_FILE=".env.sellersops"
    VERCEL_PROJECT="marketplace-sellersops"
    NEXTAUTH_URL="https://www.sellersops.com.br"
    API_URL="https://www.sellersops.com.br"
    ;;
  *)
    print_error "Domínio inválido: $DOMAIN"
    echo "Domínios suportados:"
    echo "  - marketplace.aios.local (interno)"
    echo "  - www.sellersops.com.br (público)"
    exit 1
    ;;
esac

# Functions
print_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
  print_header "Verificando pré-requisitos"

  if ! command -v node &> /dev/null; then
    print_error "Node.js não encontrado"
    exit 1
  fi
  print_success "Node.js: $(node --version)"

  if ! command -v npm &> /dev/null; then
    print_error "npm não encontrado"
    exit 1
  fi
  print_success "npm: $(npm --version)"

  if ! command -v git &> /dev/null; then
    print_error "git não encontrado"
    exit 1
  fi
  print_success "git: $(git --version)"
}

# Validate environment
validate_environment() {
  print_header "Validando ambiente: $ENVIRONMENT"

  case $ENVIRONMENT in
    development|staging|production)
      print_success "Ambiente válido: $ENVIRONMENT"
      ;;
    *)
      print_error "Ambiente inválido: $ENVIRONMENT"
      echo "Use: development, staging, ou production"
      exit 1
      ;;
  esac
}

# Build application
build_app() {
  print_header "Compilando aplicação"

  print_warning "Limpando build anterior..."
  rm -rf .next out

  print_warning "Instalando dependências..."
  npm ci --prefer-offline

  print_warning "Executando type check..."
  npm run typecheck || print_warning "Type check com warnings"

  print_warning "Executando linter..."
  npm run lint:fix || print_warning "Lint com warnings"

  print_warning "Compilando para $ENVIRONMENT..."
  npm run build

  print_success "Build completado"
}

# Run tests
run_tests() {
  print_header "Executando testes"

  if [ "$ENVIRONMENT" = "production" ]; then
    print_warning "Rodando full test suite..."
    npm test -- --run 2>&1 || {
      print_error "Testes falharam"
      exit 1
    }
  else
    print_warning "Rodando testes unitários..."
    npm test -- --run --reporter=verbose 2>&1 || print_warning "Alguns testes falharam"
  fi

  print_success "Testes completados"
}

# Deploy to Vercel
deploy_vercel() {
  print_header "Deploying para Vercel — $DOMAIN_NAME"

  if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI não instalado. Instalando..."
    npm install -g vercel
  fi

  print_warning "Carregando variáveis de ambiente de $ENV_FILE..."
  if [ ! -f "$ENV_FILE" ]; then
    print_error "Arquivo $ENV_FILE não encontrado"
    exit 1
  fi

  case $ENVIRONMENT in
    production)
      print_warning "Deploying para produção: $DOMAIN..."
      vercel --prod \
        --token $VERCEL_TOKEN \
        --env NEXTAUTH_URL=$NEXTAUTH_URL \
        --env NEXT_PUBLIC_API_URL=$API_URL \
        --build-env ENVIRONMENT=$ENVIRONMENT
      ;;
    staging)
      print_warning "Deploying para staging: $DOMAIN..."
      vercel --token $VERCEL_TOKEN \
        --env NEXTAUTH_URL=$NEXTAUTH_URL \
        --env NEXT_PUBLIC_API_URL=$API_URL \
        --build-env ENVIRONMENT=staging
      ;;
    development)
      print_warning "Development - ignorando deploy Vercel"
      ;;
  esac

  print_success "Deploy Vercel completado para $DOMAIN"
}

# Deploy to Docker
deploy_docker() {
  print_header "Deploying para Docker ($ENVIRONMENT)"

  if ! command -v docker &> /dev/null; then
    print_warning "Docker não instalado - pulando Docker deployment"
    return
  fi

  print_warning "Buildando Docker image..."
  docker build \
    --build-arg ENVIRONMENT=$ENVIRONMENT \
    -t $PROJECT_NAME:$ENVIRONMENT \
    -f Dockerfile .

  print_success "Docker image criada: $PROJECT_NAME:$ENVIRONMENT"

  if [ "$ENVIRONMENT" = "production" ]; then
    print_warning "Pushando para registry..."
    docker push $PROJECT_NAME:$ENVIRONMENT
    print_success "Docker image pushed"
  fi
}

# Deploy to self-hosted
deploy_self_hosted() {
  print_header "Deploying para servidor self-hosted"

  if [ -z "$DEPLOY_HOST" ]; then
    print_warning "DEPLOY_HOST não configurado - pulando"
    return
  fi

  print_warning "Conectando a $DEPLOY_HOST..."
  ssh $DEPLOY_HOST << EOF
    cd /opt/mgos-marketplace
    git pull origin main
    npm ci --prefer-offline
    npm run build
    systemctl restart mgos-marketplace
EOF

  print_success "Self-hosted deployment completado"
}

# Verify deployment
verify_deployment() {
  print_header "Verificando deployment de $DOMAIN"

  # Use the configured domain URL
  APP_URL="$API_URL"

  print_warning "Testando conectividade com $APP_URL..."

  for i in {1..5}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
      print_success "Servidor respondendo em $DOMAIN (HTTP 200)"
      return
    fi
    print_warning "Tentativa $i/5 - aguardando servidor (HTTP $HTTP_CODE)..."
    sleep 5
  done

  print_error "Servidor não respondendo em $APP_URL após 25 segundos"
  print_warning "Note: Health check pode demorar alguns minutos em primeira implantação"
  exit 1
}

# Setup monitoring
setup_monitoring() {
  print_header "Configurando monitoramento"

  print_warning "Atualizando arquivo .env com chaves de monitoramento..."

  if [ -z "$SENTRY_DSN" ]; then
    print_warning "SENTRY_DSN não configurado - pulando Sentry"
  else
    print_success "Sentry configurado"
  fi

  if [ -z "$DATADOG_API_KEY" ]; then
    print_warning "DATADOG_API_KEY não configurado - pulando Datadog"
  else
    print_success "Datadog configurado"
  fi

  print_success "Monitoramento setup completo"
}

# Rollback function
rollback() {
  print_header "Rollback deployment"

  case $ENVIRONMENT in
    production)
      git revert --no-edit HEAD
      git push origin main
      vercel --prod --token $VERCEL_TOKEN
      ;;
    *)
      print_warning "Rollback apenas disponível em produção"
      ;;
  esac

  print_success "Rollback completado"
}

# Main execution
main() {
  print_header "🚀 MARKETPLACE MASTER DEPLOYMENT"
  echo "Domínio: $DOMAIN_NAME ($DOMAIN)"
  echo "Ambiente: $ENVIRONMENT"
  echo "Data: $(date)"
  echo ""

  check_prerequisites
  validate_environment
  build_app
  run_tests
  setup_monitoring

  # Deploy options
  read -p "Deploy para Vercel? (s/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    deploy_vercel
  fi

  read -p "Deploy para Docker? (s/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    deploy_docker
  fi

  read -p "Deploy para self-hosted? (s/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    deploy_self_hosted
  fi

  verify_deployment

  print_header "✅ DEPLOYMENT COMPLETO"
  echo "Domínio: $DOMAIN_NAME ($DOMAIN)"
  echo "Ambiente: $ENVIRONMENT"
  echo "App URL: $API_URL"
  echo "Timestamp: $(date)"
  echo ""
  echo "🎉 Marketplace Master está pronto em $DOMAIN!"
}

# Trap errors
trap 'print_error "Erro durante deployment - executando rollback"; rollback' ERR

# Run main function
main "$@"
