package br.edu.ifg.trilhadeaprendizadoapims.user.service;

import br.edu.ifg.trilhadeaprendizadoapims.user.dto.AlunoDto;
import br.edu.ifg.trilhadeaprendizadoapims.user.dto.UsuarioCreateDto;
import br.edu.ifg.trilhadeaprendizadoapims.user.model.Aluno;
import br.edu.ifg.trilhadeaprendizadoapims.user.repository.AlunoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlunoServiceTest {

    @Mock
    private AlunoRepository repository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private AlunoService alunoService;

    @Test
    void deveRetornarAlunoDtoQuandoIdExiste() {
        Long id = 1L;
        Aluno aluno = new Aluno();
        AlunoDto dto = new AlunoDto();

        when(repository.findById(id)).thenReturn(Optional.of(aluno));
        when(modelMapper.map(aluno, AlunoDto.class)).thenReturn(dto);

        AlunoDto resultado = alunoService.buscarPorId(id);

        assertNotNull(resultado);
        verify(repository).findById(id);
        verify(modelMapper).map(aluno, AlunoDto.class);
    }

    @Test
    void deveLancarExcecaoQuandoAlunoNaoExiste() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> alunoService.buscarPorId(1L));
    }

    @Test
    void deveAtualizarAlunoComSucesso() {
        Long id = 1L;
        AlunoDto dto = new AlunoDto();
        Aluno entidadeAntiga = new Aluno();
        entidadeAntiga.setSenhaHash("hash123");

        Aluno entidadeMapeada = new Aluno();
        AlunoDto dtoRetorno = new AlunoDto();

        when(repository.findById(id)).thenReturn(Optional.of(entidadeAntiga));
        when(modelMapper.map(dto, Aluno.class)).thenReturn(entidadeMapeada);
        when(repository.save(entidadeMapeada)).thenReturn(entidadeMapeada);
        when(modelMapper.map(entidadeMapeada, AlunoDto.class)).thenReturn(dtoRetorno);

        AlunoDto resultado = alunoService.atualizar(id, dto);

        assertNotNull(resultado);
        assertEquals("hash123", entidadeMapeada.getSenhaHash());
        assertEquals(id, entidadeMapeada.getId());
        verify(repository).save(entidadeMapeada);
    }

    @Test
    void deveRetornarPaginaDeAlunoDto() {
        Pageable pageable = PageRequest.of(0, 10);
        Aluno aluno = new Aluno();
        AlunoDto dto = new AlunoDto();
        Page<Aluno> page = new PageImpl<>(List.of(aluno));

        when(repository.findAll(pageable)).thenReturn(page);
        when(modelMapper.map(any(Aluno.class), eq(AlunoDto.class))).thenReturn(dto);

        Page<AlunoDto> resultado = alunoService.buscarTodos(pageable);

        assertEquals(1, resultado.getContent().size());
        verify(repository).findAll(pageable);
    }

    @Test
    void deveInserirAlunoComValoresPadrao() {
        UsuarioCreateDto createDto = new UsuarioCreateDto();
        createDto.setSenha("senha123");
        Aluno entidade = new Aluno();
        AlunoDto dtoRetorno = new AlunoDto();

        when(modelMapper.map(createDto, Aluno.class)).thenReturn(entidade);
        when(repository.save(entidade)).thenReturn(entidade);
        when(modelMapper.map(entidade, AlunoDto.class)).thenReturn(dtoRetorno);

        AlunoDto resultado = alunoService.inserir(createDto);

        assertNotNull(resultado);
        assertEquals(1, entidade.getNivel());
        assertEquals(0, entidade.getXpTotal());
        assertNotNull(entidade.getDataCadastro());
        verify(repository).save(entidade);
    }

    @Test
    void deveAdicionarXpERecalcularNivel() {
        Long id = 1L;
        Aluno aluno = new Aluno();
        aluno.setXpTotal(90);
        aluno.setNivel(1);
        AlunoDto dtoRetorno = new AlunoDto();

        when(repository.findById(id)).thenReturn(Optional.of(aluno));
        when(repository.save(aluno)).thenReturn(aluno);
        when(modelMapper.map(aluno, AlunoDto.class)).thenReturn(dtoRetorno);

        AlunoDto resultado = alunoService.adicionarXp(id, 25);

        assertNotNull(resultado);
        assertEquals(115, aluno.getXpTotal());
        assertEquals(2, aluno.getNivel());
        verify(repository).save(aluno);
    }

    @Test
    void deveExcluirAlunoQuandoExiste() {
        Long id = 1L;
        Aluno aluno = new Aluno();

        when(repository.findById(id)).thenReturn(Optional.of(aluno));

        alunoService.excluir(id);

        verify(repository).deleteById(id);
    }

    @Test
    void deveLancarExcecaoAoExcluirAlunoInexistente() {
        when(repository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> alunoService.excluir(99L));
    }
}
