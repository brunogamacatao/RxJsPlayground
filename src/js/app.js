import { of, fromEvent } from 'rxjs';
import { skipUntil, takeUntil, repeat } from 'rxjs/operators';
import { map, filter } from 'rxjs/operators';

// Exemplo 1 - Criar um observável para cliques do mouse
const button = document.getElementById('botao');
const botaoObservable = fromEvent(button, 'click');
botaoObservable.subscribe(() => alert('Fui clicado !'));

// Exemplo 2 - Criar um observável para o movimento do cursor
const trackpad = document.getElementById('trackpad');
const cursorPosSpan = document.getElementById('cursor_pos');
const trackpadObservable = fromEvent(trackpad, 'mousemove');
trackpadObservable.subscribe((event) => {
  cursorPosSpan.textContent = `(X: ${event.clientX}, Y: ${event.clientY})`;
});

// Exemplo 3 - Encadeando observables
const draggables = document.getElementsByClassName('draggable');
Array.prototype.forEach.call(draggables, (draggable) => {
  const mouseMove = fromEvent(draggable, 'mousemove');
  const mouseDown = fromEvent(draggable, 'mousedown');
  const mouseUp   = fromEvent(draggable, 'mouseup');

  const mouseDrag = mouseMove.pipe(
    skipUntil(mouseDown),
    takeUntil(mouseUp),
    repeat()
  );

  mouseDrag.subscribe((event) => {
    let rect = draggable.getBoundingClientRect();
    draggable.style.width = event.clientX;
    draggable.style.height = event.clientY - rect.top;
  });
});

// trabalhando com dados

// Exemplo 1 - criando um observable a partir de um array
const nomes = ['zero','um','dois','tres','quatro','cinco','seis','sete','oito','nove','dez'];
const numeros = of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
numeros.pipe(
  filter(x => x > 3),
  map(x => nomes[x])
).subscribe(x => console.log(x));

// Exemplo 2 - vamos começar a implementar um autocomplete/typeahead
import { ajax } from 'rxjs/ajax';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

const campoNome = document.getElementById('campo_nome_pais');
const listaPaises = document.getElementById('lista_paises');

fromEvent(campoNome, 'keyup').pipe( // toda vez que 'teclar' uma tecla
  debounceTime(200), // evita eventos com menos de 200ms entre eles
  map(evento => evento.target.value), // ao invés do evento, passa o valor do campo
  distinctUntilChanged(), // passa para frente só eventos diferentes entre si
  map(valor => `https://restcountries.eu/rest/v2/name/${valor}`), // mapeia o valor para URL
  switchMap(url => ajax(url)), // agora sim, faz a busca no webservice (por que switchMap ?)
  map(ajaxResponse => ajaxResponse.response), // ao invés da resposta, passa os dados
  catchError(error => { // caso ocorra um erro, exibe 
    console.error(error);
    return of(error);
  }),
  repeat() // continua a execução - senão parava após o erro
).subscribe(dados => {
  listaPaises.innerHTML = ''; // limpa o conteúdo da lista
  if (dados && dados.forEach) { // se tem algum dado retornado
    dados.forEach(pais => { // para cada país retornado
      let paisEl = document.createElement('option'); // cria um novo elemento
      paisEl.text = `${pais.name} - ${pais.capital}`; // escreve o texto
      paisEl.value = pais.alpha3Code; // define o valor
      listaPaises.appendChild(paisEl); // adiciona na lista
    });
  }
});