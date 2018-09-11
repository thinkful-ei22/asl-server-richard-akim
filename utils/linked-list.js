'use strict';

class _Node {
  constructor(value, next) {
    this.value = value;
    this.next = next;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }

  insertFirst(item) {
    this.head = new _Node(item, this.head);
  }

  insertBefore(newItem, oldItem) {
    //if old item doesnt exist, insert newItem at the end
    if(this.find(oldItem) === null){
      this.insertLast(newItem);
    }
    let oldNode = this.find(oldItem);

    let curNode = this.head;
    let beforeNode;
    //if oldnode = newnode then its the first item and we insert it at beginning
    if(oldNode === curNode) {
      this.insertFirst(newItem);
    }

    while (curNode !== oldNode) {
      // console.log(curNode);
      if(curNode.next === oldNode){
        beforeNode = curNode;
      }
      curNode = curNode.next;
    }
    let newNode = new _Node(newItem, oldNode);
    if (beforeNode) {
      beforeNode.next = newNode;
    }
  }
  /// HEAD | SPOT1 | SPOT2| OLDNODE |

  insertAfter(newItem, oldItem) {
    //if old item isnt in the list, insert item at end 
    if(this.find(oldItem) === null) {
      return this.insertLast(newItem);
    }
    let oldNode = this.find(oldItem);
    let newNode = new _Node(newItem, oldNode.next);
    oldNode.next = newNode;
  }

  insertAt(newItem, position) {
    let curPosition = 1;
    let curNode = this.head;
    while (curPosition <= position) {
      if(curPosition === position){
        // console.log(`hitting conditional newitem:${newItem}, curNode.value${curNode.value}`)
        this.insertBefore(newItem, curNode.value);
      }
      if(curNode === null) {
        //looped through list and didnt find the position
        return null;
      }
      curNode = curNode.next;
      curPosition ++;
    }
  }

  insertLast(item) {
    if (this.head === null) {
      this.insertFirst(item);
    }
    else {
      let tempNode = this.head;
      while (tempNode.next !== null) {
        tempNode = tempNode.next;
      }
      tempNode.next = new _Node(item, null);
    }
  }

  addCycle(item) {
    if (this.head === null) {
      this.insertFirst(item);
    }
    else {
      let tempNode = this.head;
      while (tempNode.next !== null) {
        tempNode = tempNode.next;
      }
      tempNode.next = new _Node(item, this.head);
    }
  }

  find(item) { 
    //start at the head
    let currNode = this.head;
    //if the list is empty
    if (!this.head){
      return null;
    }
    //Check for the item 
    while(currNode.value !== item) {
      //return null if end of the list 
      // and the item is not on the list
      if (currNode.next === null) {
        return null;
      }
      else {
        //otherwise keep looking 
        currNode = currNode.next;
      }
    }
    //found it
    return currNode;
  }

  remove(item){ 
    //if the list is empty
    if (!this.head){
      return null;
    }
    //if the node to be removed is head, make the next node head
    if(this.head.value === item){
      this.head = this.head.next;
      return;
    }
    //start at the head
    let currNode = this.head;
    //keep track of previous
    let previousNode = this.head;

    while ((currNode !== null) && (currNode.value !== item)) {
      //save the previous node 
      previousNode = currNode;
      currNode = currNode.next;
    }
    if(currNode === null){
      console.log('Item not found');
      return;
    }
    previousNode.next = currNode.next;
  }

  display(){
    let currNode = this.head;
    let result = [];
    while(currNode) {
      result.push(currNode.value);
      currNode = currNode.next;
    }
    return result;
  }

  size() {
    let count = 0;
    let currNode = this.head;
    while(currNode) {
      currNode = currNode.next;
      count++;
    }
    return count;
  }

  isEmpty() {
    return !this.head;
  }

  findPrevious(item) {
    let currNode = this.head;
    let prevNode = this.head;
    if (currNode.value === item) {
      return;
    }
    while(currNode.value !== item) {
      prevNode = currNode;
      currNode = currNode.next;
    }

    return prevNode;
  }

  findLast() {
    let currNode = this.head;
    while(currNode.next) {
      currNode = currNode.next;
    }
    return currNode;
  }

}

module.export = LinkedList;