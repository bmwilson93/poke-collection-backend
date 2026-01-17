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


const checkVariantInCollection = (variant, variantArray) => {
  for (let i = 0; i< variantArray.length; i++) {
    if (Object.hasOwn(variantArray[i], variant))return i
  }
  return -1;
}


// Takes a collection object and a user_id, and updates the collection table for that user
const updateCollectionInDB = async (collection, user_id) => {
  try {
    const result = await db.query(
      'UPDATE collections SET collection = $1 WHERE user_id = $2 RETURNING collection;',
      [collection, user_id]
    );
    return result.rows[0].collection;
  } catch (error) {
    console.log(`There was an error updating the collection database: ${error}`)
    return collection;
  }
}


// Takes a card object and a collection object
// adds the card to the collection, updates the database, and returns the updated collection
// card should be an object, with properties "set_id", and "card_id"
const addCard = async (card, collection, user_id) => {
  const setIndex = checkSetInCollection(card.set_id, collection.sets)
  if (setIndex < 0) {
    // add the set to the collection, then add the card to that set
    collection.sets.push(
      {
        "set_id": card.set_id, 
        "cards": [
          {
            "card_id": card.card_id, 
            "quantities": [
              {[card.variant]: 1}
            ]
          }
        ]
      }
    );

  } else { // set exists in collection, check if card exists
    const cardIndex = checkCardInCollection(card.card_id, collection.sets[setIndex].cards)
    if (cardIndex < 0) {
      // card not in collection, add new card object to the cards array in the set object
      collection.sets[setIndex].cards.push(
        {"card_id": card.card_id, "quantities": [{[card.variant]: 1}]}
      );

    } else { // set and card both exist in collection, check if quantities exsits
      if (Object.hasOwn(collection.sets[setIndex].cards[cardIndex], 'quantities')) {
        let variantIndex = checkVariantInCollection(card.variant, collection.sets[setIndex].cards[cardIndex].quantities);
        if (variantIndex < 0) {
          // does not have the varient collected, add
          collection.sets[setIndex].cards[cardIndex].quantities.push({[card.variant]: 1})
        } else {
          // varient already in collection, increase qty
          collection.sets[setIndex].cards[cardIndex].quantities[variantIndex][card.variant] += 1;
        }
      } else { // Card exists, but doesn't have a quantities property. Add a quantities property with the variant
        collection.sets[setIndex].cards[cardIndex].quantities = [{[card.variant]: 1}]
      }
    }
  }

  const updatedCollection = updateCollectionInDB(collection, user_id);
  return updatedCollection;
}


// Takes card object and collection object
// If the set or the card id are not in the collection, returns the collection
// Removes or decreases card, updates database, and returns the updated collection
const removeCard = async (card, collection, user_id) => {
  const setIndex = checkSetInCollection(card.set_id, collection.sets)
  if (setIndex < 0) {
    // set not in collection, just return collection
    return collection;

  } else { // set exists in collection, check if card exists
    const cardIndex = checkCardInCollection(card.card_id, collection.sets[setIndex].cards)
    if (cardIndex < 0) {
      // card not is collection, just return collection
      return collection;

    } else { // card exists, check if it has quantities
      if (!Object.hasOwn(collection.sets[setIndex].cards[cardIndex], 'quantities')) {
        // card doesn't have quantities to remove, just return collection
        return collection;

      } else { // card has quantities, check if the variant exists
        const variantIndex = checkVariantInCollection(card.variant, collection.sets[setIndex].cards[cardIndex].quantities);
        if (variantIndex < 0) {
          return collection;
  
        } else { // variant exists, decrease qty or remove if only 1
          if (collection.sets[setIndex].cards[cardIndex].quantities[variantIndex][card.variant] > 1) {
            collection.sets[setIndex].cards[cardIndex].quantities[variantIndex][card.variant] -= 1;
  
          } else { // only 1 quantity, remove the variant/quantities/card
            if (collection.sets[setIndex].cards[cardIndex].quantities.length > 1) { // More than 1 variant
              // remove just the variant
              collection.sets[setIndex].cards[cardIndex].quantities.splice(variantIndex, 1)

            } else { // only the one variant, check if the card has any incoming or wishlist before removing
              if (Object.hasOwn(collection.sets[setIndex].cards[cardIndex], 'incoming') || Object.hasOwn(collection.sets[setIndex].cards[cardIndex], 'wishlist')) {
                // object has incoming or wishlist, just remove the quantities property
                delete collection.sets[setIndex].cards[cardIndex].quantities
              } else { // no other properties, remove the whole card
                collection.sets[setIndex].cards.splice(cardIndex, 1);
              }
            }
          }
        }
      }
    }
  }

  const updatedCollection = updateCollectionInDB(collection, user_id);
  return updatedCollection;
}


const addIncoming = async (card, collection, user_id) => {
  const setIndex = checkSetInCollection(card.set_id, collection.sets);
  if (setIndex < 0) {
    // set not found, add the set, card, and incoming all together
    collection.sets.push(
      {
        "set_id": card.set_id,
        "cards": [
          {
            "card_id": card.card_id,
            "incoming": {
              "card_image": card.card_image,
              "variants": [
                {[card.variant]: 1}
              ]
            }
          }
        ]
      }
    );

  } else { // Set exists in collection, check if card exists
    const cardIndex = checkCardInCollection(card.card_id, collection.sets[setIndex].cards);
    if (cardIndex < 0) {
      // card not in collection, add a new card object and set the incoming object
      collection.sets[setIndex].cards.push(
        {"card_id": card.card_id, "incoming": {"card_image": card.card_image, "variants": [{[card.variant]: 1}]}}
      )
    } else { // Set and card both exists, check if incoming property exists
      if (Object.hasOwn(collection.sets[setIndex].cards[cardIndex], 'incoming')) {
        // card has incoming already, check the variant
        let variantIndex = checkVariantInCollection(card.variant, collection.sets[setIndex].cards[cardIndex].incoming.variants);
        if (variantIndex < 0) {
          // does not have the variant incoming, add it
          collection.sets[setIndex].cards[cardIndex].incoming.variants.push({[card.variant]: 1});
        } else {
          // variant is already incoming return collection
          return collection
        }
      } else {
        // Card exists, but does not have incoming property
        collection.sets[setIndex].cards[cardIndex].incoming = {"card_image": card.card_image, "variants": [{[card.variant]: 1}]}
      }
    }
  }

  const updatedCollection = updateCollectionInDB(collection, user_id);
  return updatedCollection;
}


const removeIncoming = async (card, collection, user_id) => {
  const setIndex = checkSetInCollection(card.set_id, collection.sets);
  if (setIndex < 0) {
    return collection
  } else {
    const cardIndex = checkCardInCollection(card.card_id, collection.sets[setIndex].cards);
    if (cardIndex < 0) {
      return collection;
    } else {
      // card exists, check if card has incoming property
      if (!Object.hasOwn(collection.sets[setIndex].cards[cardIndex], 'incoming')) {
        // no incoming property, just return collection
        return collection;
      } else {
        // card has incoming, check the variants
        const variantIndex = checkVariantInCollection(card.variant, collection.sets[setIndex].cards[cardIndex].incoming.variants);
        if (variantIndex < 0) {
          return collection;
        } else {
          // variants exists, if only variant remove incoming, if no other properties, remove card
          if (collection.sets[setIndex].cards[cardIndex].incoming.variants.length > 1) {
            // multiple variants, remove just the one
            collection.sets[setIndex].cards[cardIndex].incoming.variants.splice(variantIndex, 1)
          } else {
            // only the one variant, check if card has quantities or wishlist before removing
            if (Object.hasOwn(collection.sets[setIndex].cards[cardIndex], 'quantities') || Object.hasOwn(collection.sets[setIndex].cards[cardIndex], 'wishlist')) {
              delete collection.sets[setIndex].cards[cardIndex].incoming;
            } else { // no other properties, remove the whole card
              collection.sets[setIndex].cards.splice(cardIndex, 1);
            }
          }
        }
      }
    }
  }

  const updatedCollection = updateCollectionInDB(collection, user_id);
  return updatedCollection;
}

module.exports = { addCard, removeCard, addIncoming, removeIncoming }