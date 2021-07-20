from flask import abort, jsonify, Blueprint, request
from cocamserver.tools.mysql import MySQL
import json

report_bp = Blueprint('report', __name__)

@report_bp.route('/report', methods=['POST'])
def get_report():
    if not request.data:
        abort(400, 'No Data Request')
    process_report(request.data)
    return jsonify({"code": "success"})

def process_report(data):
    mysql = MySQL()
    data_ = json.loads(data.decode('utf-8'))
    report = data_['report']
    lines = report.strip('\n').split('"\n"')
    ks = [key.replace(' ', '_').replace('-', '').replace('）', '').replace('（', '').replace('–', '').replace('(', '').
                replace(')', '').strip('\n').strip('"').lower()
            for key in lines[0].split('","')]
    # 将中文替换成英文
    if is_contains_chinese(lines[0]):
        ck = ['父_asin', '子asin', '商品名称', '买家访问次数', '买家访问次数百分比', '页面浏览次数', '页面浏览次数百分比',
              '购买按钮赢得率', '已订购商品数量', '订购数量__b2b', '订单商品数量转化率', '商品转化率__b2b', '已订购商品销售额',
              '已订购商品的销售额__b2b', '订单商品种类数', '订单商品总数__b2b']
        ek = ['parent_asin', 'child_asin', 'title', 'sessions', 'session_percentage', 'page_views',
             'page_views_percentage',
             'buy_box_percentage', 'units_ordered', 'units_ordered__b2b', 'unit_session_percentage',
             'unit_session_percentage__b2b', 'ordered_product_sales', 'ordered_product_sales__b2b', 'total_order_items',
             'total_order_items__b2b']
        keys = [ek[ck.index(k)] for k in ks]
    else:
        keys = ks
    for line in lines[1:]:
        values = [str(round(float(v1.replace('%', '').replace(',', ''))/100, 4)) if '%' in v1 else v1 for v1 in
                  [v.strip('"').replace('$', '').replace('€', '').replace('£', '')
                       .strip(' ').strip('\n') for v in line.split('","')]]
        # print(values)
        item = dict(zip(keys, values))
        for k in item:
            if k != 'title':
                item[k] = item[k].replace(',', '').replace('US', '')
        item['date'] = data_['date']
        item['seller'] = data_['seller']
        mysql.process_item(item, 'amazonBusinessReport')
        # save_data(item, 'D:/report.txt')

#检验是否含有中文字符
def is_contains_chinese(strs):
    for _char in strs:
        if '\u4e00' <= _char <= '\u9fa5':
            return True
    return False

def save_data(data, file_path):
    import os
    path = file_path
    if not os.path.exists(path):
        with open(path, 'a', encoding='utf-8') as f:
            f.write('\t'.join(data.keys()) + '\n')
    with open(path, 'a', encoding='utf-8') as f:
        l = [str(i) for i in list(data.values())]
        f.write('\t'.join(l) + '\n')