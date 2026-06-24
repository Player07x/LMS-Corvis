package br.edu.ifg.trilhadeaprendizadoapims.learning.service;

import br.edu.ifg.trilhadeaprendizadoapims.learning.dto.ConquistaDto;
import br.edu.ifg.trilhadeaprendizadoapims.learning.dto.ProgressoCreateDto;
import br.edu.ifg.trilhadeaprendizadoapims.learning.dto.ProgressoDto;
import br.edu.ifg.trilhadeaprendizadoapims.learning.dto.UsuarioConquistaDto;
import br.edu.ifg.trilhadeaprendizadoapims.learning.model.EProgresso;
import br.edu.ifg.trilhadeaprendizadoapims.learning.model.StatusProgresso;
import br.edu.ifg.trilhadeaprendizadoapims.learning.repository.ProgressoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ProgressoService {

    @Autowired
    private ProgressoRepository repository;
    @Autowired
    private ModelMapper modelMapper;
    @Autowired
    private RestTemplate restTemplate;
    @Autowired
    private UsuarioConquistaService usuarioConquistaService;

    @Value("${gateway.url:http://localhost:8080}")
    private String gatewayUrl = "http://localhost:8080";

    public ProgressoDto iniciarProgresso(ProgressoCreateDto dto, String jwt){
        List<EProgresso> existingProgress = repository.findAllByUsuarioIdAndTrilhaIdOrderByDataInicioDesc(dto.getUsuarioId(), dto.getTrilhaId());
        
        if (!existingProgress.isEmpty()) {
            System.out.println("Progresso já existe para o usuário " + dto.getUsuarioId() + " e a trilha " + dto.getTrilhaId() + ". Retornando progresso existente.");
            return modelMapper.map(existingProgress.get(0), ProgressoDto.class);
        }
        
        if (!verificaUsuarioValido(dto.getUsuarioId(), jwt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuário inválido ou inexistente.");
        }
        
        EProgresso entidade = modelMapper.map(dto, EProgresso.class);

        entidade.setDataInicio(LocalDateTime.now());
        entidade.setXpGanho(0);
        entidade.setStatusProgresso(StatusProgresso.EM_PROGRESSO);

        entidade.setTrilha_modulos(buscarModulosPorTrilha(entidade.getTrilhaId(), jwt));
        entidade.setModuloAtual_id(entidade.getTrilha_modulos().get(0));

        repository.save(entidade);

        return modelMapper.map(entidade, ProgressoDto.class);
    }

    public ProgressoDto concluirTrilha(Long id, String jwt){
        EProgresso entidade = repository.findById(id).orElseThrow( () -> new EntityNotFoundException("Progresso não encontrado"));
        entidade.setStatusProgresso(StatusProgresso.CONCLUIDO);

        int xpGanho = geraConquista(buscarConquista(entidade.getTrilhaId(), "TRILHA", jwt), entidade.getUsuarioId(), jwt);
        entidade.setXpGanho(xpGanho);

        repository.save(entidade);

        return modelMapper.map(entidade, ProgressoDto.class);
    }

    public ProgressoDto concluirModulo(Long id, String jwt){
        EProgresso entidade = repository.findById(id).orElseThrow( () -> new EntityNotFoundException("Progresso não encontrado"));

        if (entidade.getStatusProgresso() == StatusProgresso.CONCLUIDO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Progresso já concluído. Não é possível concluir novo módulo.");
        }

        int xpGanho = geraConquista(buscarConquista(entidade.getModuloAtual_id(), "MODULO", jwt), entidade.getUsuarioId(), jwt);

        entidade.setPercentual(percentualPorModuloConcluido(entidade.getTrilha_modulos().size()));
        entidade.setXpGanho(xpGanho);

        Long nextId = getNextModuleId(entidade);

        if (nextId < 0) {
            repository.save(entidade);
            return concluirTrilha(entidade.getId(), jwt);
        }

        entidade.setModuloAtual_id(nextId);
        repository.save(entidade);

        return modelMapper.map(entidade, ProgressoDto.class);
    }

    public ProgressoDto obterProgresso(Long usuario_id, Long trilha_id){
        List<EProgresso> progressos = repository.findAllByUsuarioIdAndTrilhaIdOrderByDataInicioDesc(usuario_id, trilha_id);
        
        if (progressos.isEmpty()) {
            throw new EntityNotFoundException("Progresso não encontrado");
        }
        
        EProgresso entidade = progressos.get(0);
        
        if (progressos.size() > 1) {
            System.out.println("Encontrado " + progressos.size() + " progressos para o usuário " + usuario_id + " e trilha " + trilha_id + ". Mantendo o mais recente.");
            for (int i = 1; i < progressos.size(); i++) {
                repository.delete(progressos.get(i));
            }
        }

        return modelMapper.map(entidade, ProgressoDto.class);
    }

    public void excluirProgresso(Long id){
        EProgresso entidade = repository.findById(id).orElseThrow( () -> new EntityNotFoundException("Progresso não encontrado"));
        repository.delete(entidade);
    }

    public int geraConquista(ConquistaDto conquista, Long usuario_id, String jwt){

        if (conquista == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados da conquista não encontrados");
        }

        try {
            UsuarioConquistaDto dto = new UsuarioConquistaDto();
            dto.setConquistaId(conquista.getId());
            dto.setUsuarioId(usuario_id);

            dto.setConquistaNome(conquista.getNome());
            dto.setConquistaTipo(conquista.getTipo());
            dto.setConquistaDescricao(conquista.getDescricao());
            dto.setConquistaXpGanho(conquista.getXpGanho());

            if (dto.getConquistaTipo().equals("TRILHA")){
                dto.setConquistaTrilha(conquista.getTrilha_nome());
            } else if (dto.getConquistaTipo().equals("MODULO")) {
                dto.setConquistaModulo(conquista.getModulo_nome());
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de conquista inválido: " + dto.getConquistaTipo());
            }

            dto.setDataConquista(LocalDateTime.now());

            usuarioConquistaService.gerarConquista(dto);

            try {
                String url = gatewayEndpoint(String.format("/usuario/aluno/%d/add-xp", usuario_id));
                
                String jsonBody = String.format("{\"xpGanho\": %d}", dto.getConquistaXpGanho());
                
                HttpHeaders headers = criarHeadersComJwt(jwt);
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
                
                restTemplate.put(url, request);
                System.out.println("Atualizado XP do usuário " + usuario_id + " por " + dto.getConquistaXpGanho());
            } catch (Exception e) {
                System.err.println("Falha ao atualizar XP do usuário: " + e.getMessage());
            }

            return dto.getConquistaXpGanho();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao gerar conquista", e);
        }

    }

    public Double percentualPorModuloConcluido(int size){
        Double percentual = 100.0 / size;
        return percentual;
    }

    public Long getNextModuleId(EProgresso entidade){
        int index = entidade.getTrilha_modulos().indexOf(entidade.getModuloAtual_id()) + 1;

        if (index > entidade.getTrilha_modulos().size() - 1){
            return (long) -1;
        }

        return entidade.getTrilha_modulos().get(index);
    }

    //Comunicação entre serviços

    public ConquistaDto buscarConquista(Long id, String tipo, String jwt) {
        String url;

        if (tipo.equals("TRILHA")) {
            url = gatewayEndpoint(String.format("/trilha/%d/trilha-conquista-detalhada", id));
        } else if (tipo.equals("MODULO")) {
            url = gatewayEndpoint(String.format("/trilha/modulo-conquista-detalhada/%d", id));
        }else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de conquista inválido: " + tipo);
        }

        try {
            HttpHeaders headers = criarHeadersComJwt(jwt);
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<ConquistaDto> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                entity, 
                ConquistaDto.class
            );
            
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conquista não encontrada");
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Erro ao buscar conquista: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Servico de trilhas indisponivel", e);
        }

    }

    public List<Long> buscarModulosPorTrilha(Long trilhaId, String jwt) {
        String url = gatewayEndpoint(String.format("/trilha/%d/modulos-ids", trilhaId));

        try {
            HttpHeaders headers = criarHeadersComJwt(jwt);
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<List<Long>> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                entity,
                new ParameterizedTypeReference<List<Long>>() {}
            );

            if (response.getBody() == null || response.getBody().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum módulo encontrado para a trilha");
            }

            return response.getBody();

        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Trilha não encontrada");
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Erro ao buscar módulos: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Servico de trilhas indisponivel", e);
        }

    }

    public Boolean verificaUsuarioValido(Long usuario_id, String jwt) {
        String alunoUrl = gatewayEndpoint(String.format("/usuario/aluno/%d", usuario_id));
        String adminUrl = gatewayEndpoint(String.format("/usuario/admin/%d", usuario_id));

        return verificaUsuarioPorEndpoint(alunoUrl, jwt) || verificaUsuarioPorEndpoint(adminUrl, jwt);
    }

    private Boolean verificaUsuarioPorEndpoint(String url, String jwt) {

        try {
            HttpHeaders headers = criarHeadersComJwt(jwt);
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Object> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                entity, 
                Object.class
            );
            
            return response.getStatusCode() == HttpStatus.OK;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        } catch (HttpClientErrorException.Forbidden | HttpClientErrorException.Unauthorized e) {
            return false;
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Erro ao verificar usuario: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Servico de usuarios indisponivel", e);
        }
    }
    
    private HttpHeaders criarHeadersComJwt(String jwt) {
        HttpHeaders headers = new HttpHeaders();
        if (jwt != null && !jwt.isEmpty()) {
            // Propagar o JWT original do usuário - MUITO MAIS SIMPLES E SEGURO!
            headers.set("Authorization", "Bearer " + jwt);
        }
        // Se jwt for null, faz requisição sem autenticação (para endpoints públicos)
        return headers;
    }

    private String gatewayEndpoint(String path) {
        if (gatewayUrl.endsWith("/") && path.startsWith("/")) {
            return gatewayUrl.substring(0, gatewayUrl.length() - 1) + path;
        }

        if (!gatewayUrl.endsWith("/") && !path.startsWith("/")) {
            return gatewayUrl + "/" + path;
        }

        return gatewayUrl + path;
    }

}
