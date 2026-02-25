package com.example.petflow;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class MenuControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnMenuStructureWithAllSections() throws Exception {
        mockMvc.perform(get("/menu"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.sections.length()").value(4))
            .andExpect(jsonPath("$.sections[0].label").value("Cadastros"))
            .andExpect(jsonPath("$.sections[0].groups[0].title").value("Cadastros"))
            .andExpect(jsonPath("$.sections[1].label").value("Vendas"))
            .andExpect(jsonPath("$.sections[1].groups[1].items[3].locked").value(true))
            .andExpect(jsonPath("$.sections[2].label").value("Estoque"))
            .andExpect(jsonPath("$.sections[2].groups[1].items[2].label").value("Ordens de produção"))
            .andExpect(jsonPath("$.sections[2].groups[1].items[2].locked").value(true))
            .andExpect(jsonPath("$.sections[3].label").value("Financeiro"))
            .andExpect(jsonPath("$.sections[3].groups[0].items[7].label").value("Faturamento agrupado"))
            .andExpect(jsonPath("$.sections[3].reportLabel").value("Ver relatórios financeiros"));
    }
}
