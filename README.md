# AWS Tunnel Manager

Gerenciador de túneis SSH via AWS Systems Manager (SSM) com interface gráfica intuitiva.

## Sobre

O AWS Tunnel Manager é uma aplicação desktop desenvolvida com Electron que facilita a criação e gerenciamento de túneis SSH para instâncias EC2 através do AWS Systems Manager Session Manager.

## Funcionalidades

- **Gerenciamento de Perfis**: Crie e gerencie múltiplos perfis de conexão
- **Interface Gráfica Intuitiva**: Interface moderna desenvolvida com React
- **Monitoramento em Tempo Real**: Acompanhamento do status da conexão
- **Ícone de Bandeja**: Acesso rápido através do system tray com indicador visual
- **Alertas de Token**: Notificações quando o token AWS está próximo de expirar
- **Múltiplas Regiões**: Suporte para diferentes regiões AWS
- **Portas Personalizáveis**: Configuração flexível de portas local e remota

## Requisitos

- **AWS CLI**: Necessário para criar os túneis SSM
- **AWS SDK**: Para gerenciamento de credenciais e recursos
- **Node.js**: Para desenvolvimento e build

## Instalação

### Download do pacote .deb

Baixe o arquivo `.deb` da última release e instale:

```bash
sudo dpkg -i aws-tunnel-app_1.0.0_amd64.deb

# Se houver dependências faltando:
sudo apt-get install -f
```

### Compilar do código-fonte

1. Clone o repositório:
```bash
git clone https://github.com/alexandre-henrique-rp/aws-tunnel-app.git
cd aws-tunnel-app
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Execute em modo de desenvolvimento:
```bash
npm start
# ou
yarn start
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia a aplicação em modo de desenvolvimento |
| `npm run build` | Compila o projeto |
| `npm run build:main` | Compila apenas o processo principal |
| `npm run build:renderer` | Compila apenas o renderer |
| `npm run pack` | Empacota sem criar instalador |
| `npm run dist` | Cria os pacotes de distribuição |
| `npm run dist:deb` | Cria o pacote .deb para Linux |
| `npm run dist:linux` | Cria pacotes para Linux |

## Tecnologias

- **Electron**: Framework para aplicações desktop
- **React**: Biblioteca para interface do usuário
- **TypeScript**: Linguagem de programação tipada
- **AWS SDK**: Integração com serviços AWS
- **esbuild**: Bundler rápido para o renderer

## Estrutura do Projeto

```
aws-tunnel-app/
├── src/
│   ├── main.ts              # Processo principal Electron
│   ├── preload.ts           # Script de preload
│   ├── renderer.ts          # Entry point do renderer
│   ├── views/               # Componentes React
│   ├── services/            # Lógica de negócio
│   ├── storage/             # Persistência de dados
│   └── models/              # Interfaces e tipos
├── public/                  # Assets estáticos
├── dist/                    # Código compilado
├── release/                 # Pacotes gerados
└── electron-builder.json    # Configuração do builder
```

## Configuração

A aplicação armazena dados em:
- **Linux**: `~/.config/aws-tunnel-app/`

## Autor

**Alexandre Henrique** - kingdevtec@gmail.com

## Licença

Este projeto não possui uma licença definida no momento.

## Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Suporte

Para reportar bugs ou sugerir melhorias, abra uma issue no GitHub.
