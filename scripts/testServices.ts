// scripts/testServices.ts
import { getService } from "../src/services/serviceRegistry";
import { SERVICES } from "../src/constants";
import "../src/services/initServices"; // Initialize services

const testBookService = async () => {
  try {
    const bookService = getService(SERVICES.BOOK_SERVICE);
    const bookDetails = await bookService.getBookDetails("alice-in-wonderland");
    console.log("BookService test successful:", bookDetails);
  } catch (error) {
    console.error("BookService test failed:", error);
  }
};

const runTests = async () => {
  console.log("Testing services...");
  
  // Wait for services to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testBookService();
  // Test other services
  
  console.log("Tests completed");
};

runTests().catch(console.error);
