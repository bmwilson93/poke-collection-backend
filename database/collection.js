const db = require('./db');


// Helper functions

// Checks if the given set_id exists in the given collection sets array
// Takes a string and an array, returns -1 if no index found
const checkSetInCollection = (setId, setsArray) => {
  for (let i = 0; i < setsArray.length; i++) {
    if (setId === setsArray[i].set_id) return i
  }
  return -1;
}


const checkCardInCollection = (card_id, cardsArray) => {
  for (let i = 0; i < cardsArray.length; i++) {
    if (card_id === cardsArray[i].card_id) return i
  }
  return -1;
}


// Takes a card object and a collection object
// adds the card to the collection, updates the database, and returns the updated collection
// card should be an object, with properties "set_id", and "card_id"
const addCard = async (card, collection, user_id) => {

  console.log('collection before addCard:')
  console.log(collection)

  const setIndex = checkSetInCollection(card.set_id, collection.sets)
  if (setIndex < 0) {
    // add the set to the collection, then add the card to that set
    collection.sets.push(
      {
        "set_id": card.set_id, 
        "cards": [
          {"card_id": card.card_id, "quantity": 1}
        ]
      }
    );

  } else { // set exists in collection, check if card exists
    const cardIndex = checkCardInCollection(card.card_id, collection.sets[setIndex].cards)
    if (cardIndex < 0) {
      collection.sets[setIndex].cards.push(
        {"card_id": card.card_id, "quantity": 1}
      );

    } else { // set and card both exist in collection, simply increase quantity
      collection.sets[setIndex].cards[cardIndex].quantity += 1;

    }
  }

  let updatedCollection = collection;
  // update the database with the new collection -- will need the user_id to do that
  try {
    const result = await db.query(
      'UPDATE collections SET collection = $1 WHERE user_id = $2 RETURNING collection;',
      [collection, user_id]
    );
    console.log('returned result:')
    console.log(result.rows[0])
    updatedCollection = result.rows[0].collection;
  } catch (error) {
    console.log(error);
  }
  // return the collection object

  console.log('collection after addCard:')
  console.log(updatedCollection);

  return updatedCollection
}

const removeCard = async (card, collection) => {}

module.exports = { addCard, removeCard }