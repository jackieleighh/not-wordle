import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// material
import {
  Grid, Box, Typography, Modal, Snackbar, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// keyboard
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import './index.css';

const PLACE = {
  Correct: 0,
  Almost: 1,
  Nope: 2,
};

const GuessTable = styled.div`
  display: table;
  border-collapse: separate;
  border-spacing: 10px;
`;

const GuessRow = styled.div`
  display: table-row;
`;

interface LetterProps {
  isCorrect?: number
}

const Letter = styled(Typography)`
  display: table-cell;
  padding: 10px;
  font-size: 24px;
  color: white;
  width: 60px;
  height: 60px;
  text-align: center;
  vertical-align: middle;
  background: ${({ isCorrect }: LetterProps) => (isCorrect === 0 && '#009933')
    || (isCorrect === 1 && '#ffcc00')
    || (isCorrect === 2 && '#808080')
    || '#D3D3D3'
};
`;

export default function App() {
  // 6 tries, 5 letters
  const [word, setWord] = useState('');
  const [currentGuess, setCurrentGuess] = useState(['', '', '', '', '']);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [guesses, setGuesses] = useState<any[]>([]);

  // modal notifications
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');
  const handleModalClose = () => setModalOpen(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackNoti, setSnackbarNoti] = useState('');
  const handleSnackClose = () => setSnackbarOpen(false);

  // for keyboard
  const [greenKeys, setGreenKeys] = useState('');
  const [yellowKeys, setYellowKeys] = useState('');
  const [greyKeys, setGreyKeys] = useState('');

  const requestOptions = {
    async: true,
    crossDomain: true,
    method: 'GET',
    headers: { 'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com', 'x-rapidapi-key': 'afa7fae32fmsh8f407ff9a66182dp11fb5fjsnf28f85cb368d' },
  };

  // get random word
  useEffect(() => {
    fetch('https://wordsapiv1.p.rapidapi.com/words/?letterPattern=^(%3F:([A-Za-z])(%3F!.*%5C1))*$&letters=5&random=true', requestOptions)
      .then((res) => res.json())
      .then(
        (result) => {
          setWord(result.word.toUpperCase());
        },
        (error) => {
          console.error(error);
        },
      );
  }, []);

  const onKeyboardPress = (button: string) => {
    if (button === '{ent}' && currentIdx === 5) {
      // check if exists
      const guessStr = currentGuess.toString().replaceAll(',', '');
      fetch(`https://wordsapiv1.p.rapidapi.com/words/${guessStr}`, requestOptions)
        .then((res) => res.json())
        .then(
          (result) => {
            if (result.word) {
              // add to tries
              const guess = []; let correct = 0;
              let greenKeyStr = greenKeys;
              let yellowKeyStr = yellowKeys;
              let greyKeyStr = greyKeys;
              for (let i = 0; i < 5; i += 1) {
                if (currentGuess[i] === word.charAt(i)) {
                  guess[i] = { letter: currentGuess[i], correct: PLACE.Correct };
                  correct += 1;
                  if (!greenKeyStr.includes(currentGuess[i])) {
                    greenKeyStr += `${currentGuess[i]} `;
                    yellowKeyStr = yellowKeyStr.replace(currentGuess[i], '');
                  }
                } else if (word.includes(currentGuess[i])) {
                  guess[i] = { letter: currentGuess[i], correct: PLACE.Almost };
                  if (!yellowKeyStr.includes(currentGuess[i])
                  && !greenKeyStr.includes(currentGuess[i])) {
                    yellowKeyStr += `${currentGuess[i]} `;
                  }
                } else {
                  guess[i] = { letter: currentGuess[i], correct: PLACE.Nope };
                  if (!greyKeyStr.includes(currentGuess[i])) {
                    greyKeyStr += `${currentGuess[i]} `;
                  }
                }
              }

              setGreenKeys(greenKeyStr);
              setYellowKeys(yellowKeyStr);
              setGreyKeys(greyKeyStr);

              // DID WE WIN??
              if (correct === 5) {
                // WE WON!!!!
                setModalTitle(`woooo! ${guessStr.toLowerCase()}!`);
                setModalBody('you are so cool you just won not the real wordle! congrats!');
                setModalOpen(true);
              } else if (guesses.length < 5) {
                setGuesses([...guesses, guess]);
                // reset everything
                setCurrentGuess(['', '', '', '', '']);
                setCurrentIdx(0);
              } else {
                // oh no we ran out of tries :(
                setModalTitle('oh no!');
                setModalBody(`looks like you ran out of tries :( your word was ${word}`);
                setModalOpen(true);
              }
            } else {
              setSnackbarNoti(`oh no! ${guessStr} is not a word`);
              setSnackbarOpen(true);
            }
          },
          (error) => {
            console.error(error);
          },
        );
    } else if (button === '{backspace}' && currentIdx > 0) {
      const guess = currentGuess;
      guess[currentIdx - 1] = '';
      setCurrentIdx(currentIdx - 1);
      setCurrentGuess(guess);
    } else if (button !== '{backspace}' && button !== '{ent}' && currentIdx < 5) {
      const guess = currentGuess;
      guess[currentIdx] = button;
      setCurrentIdx(currentIdx + 1);
      setCurrentGuess(guess);
    }
  };

  const getGuessesLeft = () => {
    const t = [];
    const letters = [];
    for (let i = 0; i < 5; i += 1) letters.push(<Letter key={i} />);
    for (let i = guesses.length; i < 5; i += 1) {
      t.push(<GuessRow key={i}>{letters}</GuessRow>);
    }
    return t;
  };

  const snackbarAction = (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={handleSnackClose}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: '100vh' }}
    >
      <Grid item xs={3} style={{ maxWidth: '420px', padding: '0 10px', textAlign: 'center' }}>
        <Typography variant="h4">not wordle!</Typography>
        <GuessTable>
          { /* render already attempted */ }
          {guesses.map((g, i) => (
            <GuessRow key={i}>
              {g.map((l: { correct: number, letter: string }, j: number) => (
                <Letter isCorrect={l.correct} key={j}>{l.letter}</Letter>
              ))}
            </GuessRow>
          ))}
          <GuessRow>
            { /* render current guess */ }
            {currentGuess.map((g, i) => <Letter key={i}>{g}</Letter>)}
          </GuessRow>
          { /* render blank rows */ }
          {getGuessesLeft()}
        </GuessTable>
        { /* render keyboard */ }
        <Keyboard
          onKeyPress={(button: string) => onKeyboardPress(button)}
          layout={{
            default: [
              'Q W E R T Y U I O P',
              'A S D F G H J K L',
              '{ent} Z X C V B N M {backspace}',
            ],
          }}
          display={{
            '{backspace}': '⌫',
            '{ent}': 'go!',
          }}
          theme="hg-theme-default hg-layout-default"
          buttonTheme={[
            {
              class: 'key-grey',
              buttons: greyKeys,
            },
            {
              class: 'key-yellow',
              buttons: yellowKeys,
            },
            {
              class: 'key-green',
              buttons: greenKeys,
            },
          ]}
        />
        { /* modal for notis */ }
        <Modal
          open={modalOpen}
          onClose={handleModalClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            background: 'white',
            border: '2px solid #000',
            boxShadow: '24px',
            padding: '15px',
          }}
          >
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleModalClose}
              style={{ position: 'absolute', top: '5px', right: '5px' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              {modalTitle}
            </Typography>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              {modalBody}
            </Typography>
          </Box>
        </Modal>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={2000}
          onClose={handleSnackClose}
          message={snackNoti}
          action={snackbarAction}
        />
      </Grid>
    </Grid>
  );
}
