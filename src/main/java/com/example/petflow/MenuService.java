package com.example.petflow;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.petflow.MenuModels.MenuGroup;
import com.example.petflow.MenuModels.MenuItem;
import com.example.petflow.MenuModels.MenuResponse;
import com.example.petflow.MenuModels.MenuSection;

@Service
public class MenuService {
    public MenuResponse getMenu() {
        MenuSection cadastros = new MenuSection(
            "cadastros",
            "Cadastros",
            List.of(
                new MenuGroup("Cadastros", List.of(
                    new MenuItem("Produtos", false),
                    new MenuItem("Clientes e fornecedores", false),
                    new MenuItem("Vendedores", false),
                    new MenuItem("Funcionários", false),
                    new MenuItem("Contas Financeiras", false),
                    new MenuItem("Categorias Financeiras", false),
                    new MenuItem("Formas de pagamento", false)
                )),
                new MenuGroup("Anúncios e publicidade", List.of(
                    new MenuItem("ADS", false)
                )),
                new MenuGroup("Ferramentas", List.of(
                    new MenuItem("Categorias de produtos", false),
                    new MenuItem("Listas de preços", false)
                ))
            ),
            "Ver relatórios de cadastros"
        );

        MenuSection vendas = new MenuSection(
            "vendas",
            "Vendas",
            List.of(
                new MenuGroup("Gestão", List.of(
                    new MenuItem("Gestão de anúncios", false),
                    new MenuItem("Pedidos de venda", false),
                    new MenuItem("Notas fiscais de saída", false),
                    new MenuItem("NFC-e", false),
                    new MenuItem("Frente de caixa", false),
                    new MenuItem("Importar pedidos manualmente", false),
                    new MenuItem("Propostas comerciais", false)
                )),
                new MenuGroup("Logística", List.of(
                    new MenuItem("Objetos de postagem", false),
                    new MenuItem("Logística reversa", false),
                    new MenuItem("Checkout de pedidos", false),
                    new MenuItem("Impressão automática de etiquetas", true),
                    new MenuItem("Envios por Melhor Envio", false)
                )),
                new MenuGroup("Serviços", List.of(
                    new MenuItem("Contratos", false),
                    new MenuItem("Ordens de serviço", false),
                    new MenuItem("CT-e", false),
                    new MenuItem("Notas de serviço", false),
                    new MenuItem("Cobranças", false),
                    new MenuItem("Relatórios de serviço", false)
                ))
            ),
            "Ver relatórios de vendas"
        );

        MenuSection estoque = new MenuSection(
            "estoque",
            "Estoque",
            List.of(
                new MenuGroup("Compras", List.of(
                    new MenuItem("Pedidos de compra", false),
                    new MenuItem("Notas fiscais de entrada", false),
                    new MenuItem("Fornecedores", false),
                    new MenuItem("Sugestão de Compras", true)
                )),
                new MenuGroup("Estoque", List.of(
                    new MenuItem("Lançamentos de estoque", false),
                    new MenuItem("Conferência de estoque", false),
                    new MenuItem("Ordens de produção", true),
                    new MenuItem("Depósitos", false)
                ))
            ),
            "Ver relatórios de compras e estoque"
        );

        MenuSection financeiro = new MenuSection(
            "financeiro",
            "Financeiro",
            List.of(
                new MenuGroup("Gestão financeira", List.of(
                    new MenuItem("Caixas e bancos", false),
                    new MenuItem("Contas a pagar", false),
                    new MenuItem("Contas a receber", false),
                    new MenuItem("Remessas e retornos", true),
                    new MenuItem("Ficha Financeira", false),
                    new MenuItem("Comissões", false),
                    new MenuItem("Controle de caixa", false),
                    new MenuItem("Faturamento agrupado", true)
                )),
                new MenuGroup("Tributos e contabilidade", List.of(
                    new MenuItem("DAS MEI", false),
                    new MenuItem("GNRE e DARE-SP", false),
                    new MenuItem("Espaço meu contador", false)
                )),
                new MenuGroup("Soluções financeiras", List.of(
                    new MenuItem("Bling Conta", false)
                ))
            ),
            "Ver relatórios financeiros"
        );

        return new MenuResponse(List.of(cadastros, vendas, estoque, financeiro));
    }
}
