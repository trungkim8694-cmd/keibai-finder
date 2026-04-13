import sys
sys.path.append("/Users/kimtrung/keibai-finder/crawler")
from crawler_utils import convert_reiwa_range_to_datetimes

date_str = "令和８年５月１日午前９時００分　から　令和８年５月１２日午後５時００分"
print(convert_reiwa_range_to_datetimes(date_str))
