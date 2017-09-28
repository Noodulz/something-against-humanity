const GameManager = require('../gameManager');

const enterRoom = (io, client, roomname) => {
  const game = GameManager.getRoom(roomname);
  //add player here instead of in lobby ctrl, need to pass in username then
  io.to(roomname).emit('updatePlayers', game.players);
};

//add leave room here

const startGame = (io, client, roomname) => {
  const game = GameManager.getRoom(roomname);
  game.startTurn();
  io.to(roomname).emit('updatePlayers', game.players);
  game.updatePhase('submission');
  io.to(roomname).emit('updatePlayers', game.players);
  io.to(roomname).emit('gameHasStarted');

  //close room and update lobby
  GameManager.closeRoom(roomname);
  io.to('lobby').emit('allRooms', GameManager.rooms); 
};

const initializeGame = (io, client, roomname, username) => {
  const game = GameManager.getRoom(roomname);
  client.emit('refillHand', game.refillHand(username));
  client.emit('setupNewTurn', game.blackCard, game.getCzar());
  client.emit('updatePhase', game.turnPhase);
};

const cardSubmission = (io, client, roomname, username, cards) => {
  const game = GameManager.getRoom(roomname);
  game.submitCard(username, cards);
  client.emit('refillHand', game.refillHand(username));
  io.to(roomname).emit('updateSubmittedCards', game.submissions);
  if (game.haveAllSubmitted()) {
    io.to(roomname).emit('updatePhase', game.updatePhase('revelation'));
  }
};

const revealCard = (io, client, roomname, username) => {
  const game = GameManager.getRoom(roomname);
  //do we want reveal card to return, or breakinto two lines?
  game.revealCard(username);
  io.to(roomname).emit('updateSubmittedCards', game.submissions);
  if (game.areAllCardsRevealed()) {
    io.to(roomname).emit('updatePhase', game.updatePhase('judgement'));
  }
};

const winnerSelected = (io, client, roomname, username) => {
  const game = GameManager.getRoom(roomname);
  game.selectWinner(username); //this updates both submissions and players
  io.to(roomname).emit('updateSubmittedCards', game.submissions);
  io.to(roomname).emit('updatePlayers', game.players);
  io.to(roomname).emit('updatePhase', game.updatePhase('end'));
};

const endTurn = (io, client, roomname) => {
  const game = GameManager.getRoom(roomname);
  game.startTurn();
  io.to(roomname).emit('setupNewTurn', game.blackCard, game.getCzar());
  io.to(roomname).emit('updatePlayers', game.players);
  io.to(roomname).emit('updateSubmittedCards', game.submissions);
  io.to(roomname).emit('updatePlayers', game.players);
  io.to(roomname).emit('updatePhase', game.updatePhase('submission'));
};


module.exports = {
  enterRoom,
  startGame,
  initializeGame,
  cardSubmission,
  revealCard,
  winnerSelected,
  endTurn
};

