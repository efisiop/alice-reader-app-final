// scripts/simple-test.js
// Simple test script

console.log('Running simple test...');

// Create a simple class
class TestClass {
  constructor() {
    this.data = {};
  }
  
  add(key, value) {
    this.data[key] = value;
    console.log(`Added ${key}: ${value}`);
  }
  
  get(key) {
    return this.data[key];
  }
  
  list() {
    return Object.keys(this.data);
  }
}

// Create an instance
const test = new TestClass();

// Add some data
test.add('item1', 'Value 1');
test.add('item2', 'Value 2');

// Get data
console.log('item1:', test.get('item1'));
console.log('item2:', test.get('item2'));

// List all items
console.log('All items:', test.list());

console.log('Test completed successfully!');
