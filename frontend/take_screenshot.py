from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

options = webdriver.ChromeOptions()
options.add_argument('--start-maximized')
driver = webdriver.Chrome(options=options)

try:
    driver.get('http://localhost:3000/monitor')
    time.sleep(3)  # Wait for page to load
    driver.save_screenshot('monitor-massage-tab.png')
    print('Screenshot saved: monitor-massage-tab.png')
finally:
    driver.quit()
